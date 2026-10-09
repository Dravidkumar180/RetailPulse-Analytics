"""Authorization, validation and atomic business-change application for approvals."""
from datetime import UTC, datetime, date
from decimal import Decimal
from uuid import UUID
from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from sqlalchemy import select, update, or_
from app.core.constants import AuditAction, UserRole, UserStatus
from app.models.workflow import ApprovalRequest, ApprovalHistory, WorkflowConfig
from app.models.catalog import Product
from app.models.customer import Customer, CustomerTimeline
from app.models.inventory import Inventory, InventoryMovement
from app.models.bulk_import import BulkImportJob, BulkImportRow
from app.models.user import User
from app.models.notification import Notification
from app.services.audit_log_service import audit_log_service
from app.services import data_quality_service  # register transactional quality outbox listeners

TYPES = ('STOCK_ADJUSTMENT','PRODUCT_DEACTIVATION','PRODUCT_PRICE_CHANGE','CUSTOMER_INFORMATION_CHANGE','INVENTORY_IMPORT_APPROVAL')
ADMINS = ('COMPANY_ADMIN','SUPER_ADMIN')
CUSTOMER_FIELDS = ('full_name','email','phone','gender','date_of_birth','address','city','state','country','customer_type','preferred_sales_channel','status')

def require_company(user):
    if not user.company_id:
        raise HTTPException(403, 'Select a company account to use workflows.')

def config(db, company_id, kind):
    if kind not in TYPES:
        raise HTTPException(422, 'Unsupported request type.')
    row = db.scalar(select(WorkflowConfig).where(WorkflowConfig.company_id == company_id, WorkflowConfig.request_type == kind))
    return row or WorkflowConfig(company_id=company_id, request_type=kind, approver_role='COMPANY_ADMIN', approval_required=True, active=True, allow_self_approval=False)

def required(db, company_id, kind):
    c = config(db, company_id, kind)
    return c.active and c.approval_required

def guard(db, user, kind):
    if required(db, user.company_id, kind):
        raise HTTPException(409, 'Approval required. Submit this change with a reason in Workflows; the record has not been changed.')

def can_approve(user, row):
    return user.company_id == row.company_id and (user.role == row.approver_role or user.role in ADMINS) and (user.id != row.requester_id or row.allow_self_approval)

def eligible_approvers(db, company_id, approver_role, requester_id, allow_self_approval):
    query = select(User).where(User.company_id == company_id, User.status == UserStatus.ACTIVE,
        or_(User.role == approver_role, User.role.in_(ADMINS)))
    if not allow_self_approval:
        query = query.where(User.id != requester_id)
    return db.scalars(query).all()

def visible(user):
    require_company(user)
    scope = ApprovalRequest.company_id == user.company_id
    if user.role not in ADMINS:
        scope = scope & or_(ApprovalRequest.requester_id == user.id, ApprovalRequest.approver_role == str(user.role))
    return scope

def get_request(db, user, rid):
    row = db.scalar(select(ApprovalRequest).where(ApprovalRequest.id == rid, visible(user)))
    if row is None:
        raise HTTPException(404, 'Request not found.')
    return row

def record(db, row, user, action, previous=None, comment=None, ip='system', browser='Workflow service'):
    db.add(ApprovalHistory(request_id=row.id, actor_id=user.id, actor_name=user.name, action=action,
        from_status=previous, to_status=row.status, comment=comment))
    audit_log_service.create_log(db, company_id=row.company_id, user_id=user.id,
        action=getattr(AuditAction, 'WORKFLOW_' + action), ip_address=ip, browser=browser,
        details=f'Workflow {row.id}: {action}; type={row.request_type}; record={row.related_label}; reason={comment or row.reason}',
        before_values={'status':previous, **row.current_values}, after_values={'status':row.status, **row.requested_values})

def notify(db, row, event, recipients):
    for uid in set(recipients):
        db.add(Notification(company_id=row.company_id, user_id=uid, type='WORKFLOW_ALERT',
            title='Approval request ' + event.lower().replace('_',' '), message=f'{row.related_label}: {row.request_type.replace("_"," ").title()} — {event.lower()}.',
            priority=row.priority, resource_type='workflow', resource_id=str(row.id), path=f'/workflows?request={row.id}',
            details={'Request ID':str(row.id),'Type':row.request_type,'Status':row.status}, event_key=f'workflow:{row.id}:{event}', is_read=False))

def target(db, company_id, kind, rid):
    model = Customer if kind == 'CUSTOMER_INFORMATION_CHANGE' else BulkImportJob if kind == 'INVENTORY_IMPORT_APPROVAL' else Product
    row = db.scalar(select(model).where(model.id == rid, model.company_id == company_id).with_for_update())
    if row is None or isinstance(row, Customer) and row.is_deleted:
        raise HTTPException(404, 'Related record not found in your company.')
    return row

def validate(db, company_id, kind, rid, changes):
    item = target(db, company_id, kind, rid)
    if kind == 'STOCK_ADJUSTMENT':
        allowed = {'stock_quantity','reorder_level'}
        if 'stock_quantity' not in changes: raise HTTPException(422, 'Requested stock is required.')
        for key,v in changes.items():
            if key not in allowed or type(v) is not int or v < 0 or v > 2147483647: raise HTTPException(422, 'Stock and reorder level must be nonnegative whole numbers.')
        inv = db.scalar(select(Inventory).where(Inventory.company_id == company_id, Inventory.product_id == rid).with_for_update())
        if inv and inv.current_stock != item.stock_quantity: raise HTTPException(409, 'Product and inventory stock disagree. Reconcile before submitting.')
        if inv and changes['stock_quantity'] < inv.reserved_stock: raise HTTPException(422, 'Stock cannot be below reserved stock.')
        current = {'stock_quantity':item.stock_quantity}
        if 'reorder_level' in changes: current['reorder_level'] = inv.reorder_level if inv else 5
    elif kind == 'PRODUCT_PRICE_CHANGE':
        if set(changes) != {'unit_price'}: raise HTTPException(422, 'Only unit_price is allowed.')
        try: price = Decimal(str(changes['unit_price']))
        except Exception: raise HTTPException(422, 'Enter a valid price.')
        if not price.is_finite() or price <= 0 or price < item.cost_price or price > Decimal('9999999999.99') or price.as_tuple().exponent < -2: raise HTTPException(422, 'Price must be positive, at least cost price, and have at most two decimals.')
        changes = {'unit_price':str(price)}
        current = {'unit_price':str(item.unit_price)}
    elif kind == 'PRODUCT_DEACTIVATION':
        if changes != {'status':'INACTIVE'} or item.status != 'ACTIVE': raise HTTPException(422, 'Only active products can be deactivated.')
        current = {'status':item.status}
    elif kind == 'CUSTOMER_INFORMATION_CHANGE':
        if not changes or not set(changes).issubset(CUSTOMER_FIELDS): raise HTTPException(422, 'Invalid customer fields.')
        from app.schemas.customer import CustomerWrite
        from app.api.v1.endpoints.customers import ensure_unique
        values = {k:getattr(item,k) for k in CUSTOMER_FIELDS}
        try: data = CustomerWrite.model_validate({**values, **changes})
        except ValidationError as exc: raise HTTPException(422, jsonable_encoder(exc.errors(), custom_encoder={ValueError:str}))
        ensure_unique(db, company_id, data, item.id)
        changes = jsonable_encoder({k:getattr(data,k) for k in changes})
        current = jsonable_encoder({k:getattr(item,k) for k in changes})
    else:
        if item.import_type != 'inventory' or item.status != 'Awaiting Approval' or changes != {'release_import':True}: raise HTTPException(409, 'Only a staged inventory import awaiting approval can be released.')
        from app.services.import_validation_service import validate_records
        rows = db.scalars(select(BulkImportRow).where(BulkImportRow.job_id == item.id).order_by(BulkImportRow.row_number)).all()
        result = validate_records(db, company_id, 'inventory', {'columns':item.columns,'rowNumbers':[r.row_number for r in rows],'rows':[r.data for r in rows]})
        if any(r['status'] == 'Invalid' for r in result['rows']): raise HTTPException(422, 'Correct invalid import rows before requesting approval.')
        current = {'status':item.status,'fingerprint':item.fingerprint,'total':item.total}
    if kind != 'INVENTORY_IMPORT_APPROVAL' and all(str(current[k]) == str(v) for k,v in changes.items()): raise HTTPException(422, 'The request does not change any values.')
    label = item.full_name if isinstance(item, Customer) else item.filename if isinstance(item, BulkImportJob) else f'{item.name} ({item.sku})'
    return item, current, changes, label

def create(db, user, data, ip='system', browser='Workflow service'):
    require_company(user)
    if user.role == 'VIEWER': raise HTTPException(403, 'Viewers cannot create approval requests.')
    c = config(db, user.company_id, data.request_type)
    if not c.active: raise HTTPException(409, 'This workflow is inactive.')
    _, current, changes, label = validate(db, user.company_id, data.request_type, data.related_id, data.requested_values)
    row = ApprovalRequest(company_id=user.company_id, requester_id=user.id, requester_name=user.name,
        request_type=data.request_type, related_id=data.related_id, related_label=label, current_values=current, requested_values=changes,
        reason=data.reason.strip(), priority=data.priority, status='DRAFT', approver_role=c.approver_role,
        allow_self_approval=c.allow_self_approval, approval_required=c.approval_required)
    db.add(row); db.flush(); record(db,row,user,'CREATED',ip=ip,browser=browser)
    if not data.draft: submit(db,user,row,ip,browser)
    return row

def submit(db, user, row, ip='system', browser='Workflow service'):
    if row.requester_id != user.id: raise HTTPException(403, 'Only the requester can submit a draft.')
    c=config(db,user.company_id,row.request_type)
    if not c.active: raise HTTPException(409,'This workflow is inactive.')
    changed = db.execute(update(ApprovalRequest).where(ApprovalRequest.id == row.id, ApprovalRequest.company_id == user.company_id, ApprovalRequest.status == 'DRAFT').values(status='SUBMITTED',approver_role=c.approver_role,allow_self_approval=c.allow_self_approval,approval_required=c.approval_required,updated_at=datetime.now(UTC)))
    if not changed.rowcount: raise HTTPException(409, 'Only drafts can be submitted.')
    db.refresh(row)
    requester = db.scalar(select(User).where(User.id == row.requester_id, User.company_id == row.company_id, User.status == UserStatus.ACTIVE))
    if not requester: raise HTTPException(409, 'The requester is no longer active in this company.')
    _, current, changes, _ = validate(db,row.company_id,row.request_type,row.related_id,row.requested_values)
    if current != row.current_values: raise HTTPException(409, 'The record changed. Cancel this draft and create a new request.')
    record(db,row,user,'SUBMITTED','DRAFT',ip=ip,browser=browser)
    notify(db,row,'SUBMITTED',[row.requester_id])
    row.status = 'PENDING_APPROVAL'
    if row.approval_required:
        approvers = eligible_approvers(db, row.company_id, row.approver_role, row.requester_id, row.allow_self_approval)
        recipients = [u.id for u in approvers if can_approve(u,row)]
        if not recipients: raise HTTPException(409, 'No eligible active approver exists. Ask an administrator to configure this workflow.')
        record(db,row,user,'SUBMITTED','SUBMITTED',comment='Assigned to approval queue',ip=ip,browser=browser)
        notify(db,row,'PENDING_APPROVAL',recipients)
    else:
        db.flush()
        decide(db,user,row,'APPROVED','Approval not required by configuration.',ip,browser,automatic=True)

def apply(db, row, user):
    item, current, changes, _ = validate(db,row.company_id,row.request_type,row.related_id,row.requested_values)
    if current != row.current_values: raise HTTPException(409, 'Related values changed since submission. Cancel and submit a new request.')
    if isinstance(item, BulkImportJob):
        # Approval atomically releases the durable queue; processing has its own tracked result.
        item.status='Uploaded'
        return
    # Compare-and-set protects against a concurrent sale/edit, including SQLite.
    comparison = [getattr(type(item),k) == getattr(item,k) for k in changes if k != 'reorder_level']
    converted = {k:Decimal(v) if k == 'unit_price' else date.fromisoformat(v) if k == 'date_of_birth' and v else v for k,v in changes.items() if k != 'reorder_level'}
    updated = db.execute(update(type(item)).where(type(item).id == item.id, type(item).company_id == row.company_id, *comparison).values(**converted))
    if not updated.rowcount: raise HTTPException(409, 'Record changed concurrently. Please reload.')
    if row.request_type == 'STOCK_ADJUSTMENT':
        inv = db.scalar(select(Inventory).where(Inventory.company_id == row.company_id, Inventory.product_id == item.id).with_for_update())
        if not inv:
            inv=Inventory(company_id=row.company_id,product_id=item.id,current_stock=current['stock_quantity'],reserved_stock=0,available_stock=current['stock_quantity'],reorder_level=5,stock_status='IN_STOCK')
            db.add(inv);db.flush()
        available_before=inv.available_stock
        stock=changes['stock_quantity']
        inv.current_stock=stock;inv.available_stock=stock-inv.reserved_stock
        if 'reorder_level' in changes: inv.reorder_level=changes['reorder_level']
        inv.stock_status='OUT_OF_STOCK' if inv.available_stock == 0 else 'LOW_STOCK' if inv.available_stock <= inv.reorder_level else 'IN_STOCK'
        db.add(InventoryMovement(inventory_id=inv.id,movement_type='MANUAL_ADJUSTMENT',available_before=available_before,quantity_changed=stock-current['stock_quantity'],previous_quantity=current['stock_quantity'],updated_quantity=stock,reason=row.reason,remarks=f'Approval {row.id}',performed_by_id=user.id))
    if isinstance(item, Customer):
        db.add(CustomerTimeline(customer_id=item.id,event='Profile Updated',details=f'Approved request {row.id}: {row.reason}'))
        if 'full_name' in changes:
            from app.models.sales import Sale
            db.execute(update(Sale).where(Sale.company_id == row.company_id, Sale.customer_id == item.id).values(customer_name=changes['full_name']))
    # ORM listeners drive shared inventory alerts and durable data quality checks.
    for k,v in converted.items(): setattr(item,k,v)
    from sqlalchemy.orm.attributes import flag_dirty
    flag_dirty(item)

def decide(db,user,row,state,comment=None,ip='system',browser='Workflow service',automatic=False):
    if state in ('APPROVED','REJECTED') and not automatic and not can_approve(user,row): raise HTTPException(403, 'You are not an eligible approver for this request.')
    if state == 'REJECTED' and not (comment or '').strip(): raise HTTPException(422, 'A rejection reason is required.')
    if state == 'CANCELLED' and row.requester_id != user.id and user.role not in ADMINS: raise HTTPException(403, 'Only the requester or company administrator can cancel.')
    allowed = ('DRAFT','PENDING_APPROVAL') if state == 'CANCELLED' else ('PENDING_APPROVAL',)
    previous=row.status
    changed=db.execute(update(ApprovalRequest).where(ApprovalRequest.id == row.id,ApprovalRequest.company_id == user.company_id,ApprovalRequest.status.in_(allowed)).values(status=state,updated_at=datetime.now(UTC)))
    if not changed.rowcount: raise HTTPException(409, 'Request is no longer eligible for this action.')
    db.refresh(row)
    requester=db.scalar(select(User).where(User.id == row.requester_id,User.company_id == row.company_id,User.status == UserStatus.ACTIVE))
    if state == 'APPROVED':
        if not requester: raise HTTPException(409, 'Requester is no longer active in this company.')
        apply(db,row,user)
    elif row.request_type == 'INVENTORY_IMPORT_APPROVAL':
        job=target(db,row.company_id,row.request_type,row.related_id)
        if job.status == 'Awaiting Approval':
            from app.services.bulk_import_service import finish
            finish(db,job,'Cancelled',f'Workflow {row.id} {state.lower()}: {comment or row.reason}')
    record(db,row,user,state,previous,comment,ip,browser)
    if state == 'APPROVED': record(db,row,user,'APPLIED',state,'Import released to processing queue' if row.request_type == 'INVENTORY_IMPORT_APPROVAL' else 'Requested changes applied',ip,browser)
    notify(db,row,state,[row.requester_id])
    return row

def timestamp(value):
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value

def serialize(row,user):
    return jsonable_encoder({'id':row.id,'requestType':row.request_type,'requestedBy':row.requester_name,'requesterId':row.requester_id,'companyId':row.company_id,
        'relatedId':row.related_id,'relatedRecord':row.related_label,'currentValues':row.current_values,'requestedValues':row.requested_values,'reason':row.reason,
        'priority':row.priority,'status':row.status,'createdAt':timestamp(row.created_at),'updatedAt':timestamp(row.updated_at),'approverRole':row.approver_role,
        'canApprove':row.status == 'PENDING_APPROVAL' and can_approve(user,row),'canSubmit':row.status == 'DRAFT' and row.requester_id == user.id,
        'canCancel':row.status in ('DRAFT','PENDING_APPROVAL') and (row.requester_id == user.id or user.role in ADMINS)})
