"""Authenticated company-isolated workflow APIs."""
from typing import Literal
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, func, or_
from app.api.dependencies import DatabaseSession, ClientIp, BrowserInfo
from app.core.permissions import AllAuthenticatedRoles, AnalystOrHigher, CompanyAdminOrSuperAdmin
from app.core.constants import AuditAction
from app.models.workflow import ApprovalRequest, ApprovalHistory, WorkflowConfig
from app.models.catalog import Product
from app.models.customer import Customer
from app.models.bulk_import import BulkImportJob
from app.services import workflow_service as service
from app.services.audit_log_service import audit_log_service
router=APIRouter()

class RequestWrite(BaseModel):
    request_type: Literal['STOCK_ADJUSTMENT','PRODUCT_DEACTIVATION','PRODUCT_PRICE_CHANGE','CUSTOMER_INFORMATION_CHANGE','INVENTORY_IMPORT_APPROVAL']
    related_id: UUID
    requested_values: dict
    reason: str = Field(min_length=3,max_length=2000)
    priority: Literal['LOW','MEDIUM','HIGH','CRITICAL']='MEDIUM'
    draft: bool=False
    @field_validator('reason')
    @classmethod
    def reason_required(cls,value):
        if len(value.strip()) < 3: raise ValueError('Provide a meaningful reason.')
        return value.strip()

class Decision(BaseModel):
    comment: str | None = Field(None,max_length=2000)

class Configuration(BaseModel):
    approver_role: Literal['COMPANY_ADMIN','SUPER_ADMIN','ANALYST']
    approval_required: bool=True
    active: bool=True
    allow_self_approval: bool=False

@router.get('/config')
def configurations(db:DatabaseSession,current_user:AllAuthenticatedRoles):
    service.require_company(current_user)
    return [{'requestType':kind,'approverRole':c.approver_role,'approvalRequired':c.approval_required,'active':c.active,'allowSelfApproval':c.allow_self_approval,
        'eligibleApproverCount':len(service.eligible_approvers(db,current_user.company_id,c.approver_role,current_user.id,c.allow_self_approval))}
        for kind in service.TYPES for c in [service.config(db,current_user.company_id,kind)]]

@router.put('/config/{kind}')
def configure(kind:str,data:Configuration,db:DatabaseSession,current_user:CompanyAdminOrSuperAdmin,client_ip:ClientIp,browser:BrowserInfo):
    service.require_company(current_user)
    c=service.config(db,current_user.company_id,kind)
    before={k:getattr(c,k) for k in data.model_dump()}
    for k,v in data.model_dump().items():setattr(c,k,v)
    db.add(c)
    audit_log_service.create_log(db,company_id=current_user.company_id,user_id=current_user.id,action=AuditAction.WORKFLOW_CONFIG_CHANGED,
        ip_address=client_ip,browser=browser,details=f'Workflow configuration: {kind}',before_values=before,after_values=data.model_dump())
    db.commit()
    return {'requestType':kind,**data.model_dump()}

@router.get('/options')
def options(db:DatabaseSession,current_user:AllAuthenticatedRoles,kind:str,search:str='',limit:int=Query(100,ge=1,le=200)):
    service.require_company(current_user)
    service.config(db,current_user.company_id,kind)
    model=Customer if kind == 'CUSTOMER_INFORMATION_CHANGE' else BulkImportJob if kind == 'INVENTORY_IMPORT_APPROVAL' else Product
    query=select(model).where(model.company_id == current_user.company_id)
    if model == Customer: query=query.where(Customer.is_deleted.is_(False),Customer.full_name.ilike('%'+search+'%'))
    elif model == BulkImportJob: query=query.where(BulkImportJob.import_type == 'inventory',BulkImportJob.status == 'Awaiting Approval',BulkImportJob.filename.ilike('%'+search+'%'))
    else: query=query.where(or_(Product.name.ilike('%'+search+'%'),Product.sku.ilike('%'+search+'%')))
    from fastapi.encoders import jsonable_encoder
    result=[]
    for r in db.scalars(query.limit(limit)).all():
        if model == Customer: values={k:getattr(r,k) for k in service.CUSTOMER_FIELDS};label=f'{r.full_name} ({r.customer_id})'
        elif model == BulkImportJob: values={'status':r.status,'total':r.total};label=r.filename
        else: values={'stock_quantity':r.stock_quantity,'unit_price':r.unit_price,'status':r.status};label=f'{r.name} ({r.sku})'
        result.append({'id':str(r.id),'label':label,'values':jsonable_encoder(values)})
    return result

@router.get('/counts')
def counts(db:DatabaseSession,current_user:AllAuthenticatedRoles):
    rows=db.scalars(select(ApprovalRequest).where(service.visible(current_user))).all()
    statuses={s:sum(r.status == s for r in rows) for s in ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED')}
    return {'total':len(rows),**statuses,'myRequests':sum(r.requester_id == current_user.id for r in rows),
        'pendingMyApproval':sum(r.status == 'PENDING_APPROVAL' and service.can_approve(current_user,r) for r in rows),
        'byType':{kind:sum(r.request_type == kind for r in rows) for kind in service.TYPES}}

@router.get('')
def listing(db:DatabaseSession,current_user:AllAuthenticatedRoles,search:str='',request_type:str|None=None,status:str|None=None,
    scope:Literal['all','mine','queue']='all',sort:Literal['newest','oldest','priority']='newest',page:int=Query(1,ge=1),page_size:int=Query(10,ge=1,le=100)):
    filters=[service.visible(current_user)]
    if scope == 'mine':filters.append(ApprovalRequest.requester_id == current_user.id)
    if scope == 'queue':
        filters.append(ApprovalRequest.status == 'PENDING_APPROVAL')
        if current_user.role not in service.ADMINS:filters.append(ApprovalRequest.approver_role == str(current_user.role))
        filters.append(or_(ApprovalRequest.requester_id != current_user.id,ApprovalRequest.allow_self_approval.is_(True)))
    if search:filters.append(or_(ApprovalRequest.related_label.ilike('%'+search+'%'),ApprovalRequest.requester_name.ilike('%'+search+'%'),func.replace(func.cast(ApprovalRequest.id,__import__('sqlalchemy').String),'-','').ilike('%'+search.replace('-','')+'%')))
    if request_type:filters.append(ApprovalRequest.request_type == request_type)
    if status:filters.append(ApprovalRequest.status == status)
    from sqlalchemy import case
    order=ApprovalRequest.created_at.asc() if sort == 'oldest' else case({'CRITICAL':0,'HIGH':1,'MEDIUM':2,'LOW':3},value=ApprovalRequest.priority) if sort == 'priority' else ApprovalRequest.created_at.desc()
    rows=db.scalars(select(ApprovalRequest).where(*filters).order_by(order,ApprovalRequest.id).offset((page-1)*page_size).limit(page_size)).all()
    return {'items':[service.serialize(r,current_user) for r in rows],'total':db.scalar(select(func.count()).select_from(ApprovalRequest).where(*filters)),'page':page,'pageSize':page_size}

@router.post('',status_code=201)
def create(data:RequestWrite,db:DatabaseSession,current_user:AnalystOrHigher,client_ip:ClientIp,browser:BrowserInfo):
    row=service.create(db,current_user,data,client_ip,browser);db.commit();return service.serialize(row,current_user)

@router.get('/{rid}/history')
def history(rid:UUID,db:DatabaseSession,current_user:AllAuthenticatedRoles):
    service.get_request(db,current_user,rid)
    return [{'id':str(r.id),'action':r.action,'actor':r.actor_name,'fromStatus':r.from_status,'toStatus':r.to_status,'comment':r.comment,'timestamp':service.timestamp(r.timestamp)}
        for r in db.scalars(select(ApprovalHistory).where(ApprovalHistory.request_id == rid).order_by(ApprovalHistory.timestamp,ApprovalHistory.id)).all()]

@router.get('/{rid}')
def detail(rid:UUID,db:DatabaseSession,current_user:AllAuthenticatedRoles,client_ip:ClientIp,browser:BrowserInfo):
    row=service.get_request(db,current_user,rid)
    service.record(db,row,current_user,'VIEWED',row.status,ip=client_ip,browser=browser);db.commit()
    return service.serialize(row,current_user)

@router.post('/{rid}/submit')
def submit(rid:UUID,db:DatabaseSession,current_user:AnalystOrHigher,client_ip:ClientIp,browser:BrowserInfo):
    row=service.get_request(db,current_user,rid);service.submit(db,current_user,row,client_ip,browser);db.commit();return service.serialize(row,current_user)

@router.post('/{rid}/{action}')
def decision(rid:UUID,action:Literal['approve','reject','cancel'],data:Decision,db:DatabaseSession,current_user:AllAuthenticatedRoles,client_ip:ClientIp,browser:BrowserInfo):
    row=service.get_request(db,current_user,rid)
    service.decide(db,current_user,row,{'approve':'APPROVED','reject':'REJECTED','cancel':'CANCELLED'}[action],data.comment,client_ip,browser)
    db.commit();return service.serialize(row,current_user)
