"""Approval security and atomic application integration tests."""
import unittest
from unittest.mock import patch
from uuid import UUID, uuid4
from sqlalchemy import select, func
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.constants import UserRole, UserStatus
from app.models.user import User
from app.models.workflow import ApprovalRequest, ApprovalHistory, WorkflowConfig
from app.models.catalog import Product
from app.models.inventory import Inventory, InventoryMovement
from app.models.notification import Notification
from app.models.data_quality import QualityChange
from app.api.v1.endpoints.workflows import router
from app.api.v1.endpoints import products, inventory, customers
from tests import test_reports as fixtures

class WorkflowsTest(unittest.TestCase):
    def setUp(self):
        fixtures.ReportsTest.setUp(self)
        self.client.close()
        self.requester=User(company_id=self.companies[0].id,name='Requester',email='requester@test.test',password_hash='test',role=UserRole.ANALYST,status=UserStatus.ACTIVE)
        self.db.add(self.requester);self.db.commit()
        app=FastAPI()
        from app.core.exceptions import register_exception_handlers
        register_exception_handlers(app)
        app.include_router(router,prefix='/workflows')
        app.include_router(products.router,prefix='/products')
        app.include_router(inventory.router,prefix='/inventory')
        app.include_router(customers.router,prefix='/customers')
        def session():
            try:yield self.db
            except Exception:self.db.rollback();raise
        app.dependency_overrides[get_db]=session
        app.dependency_overrides[get_current_active_user]=lambda:self.current
        self.client=TestClient(app,raise_server_exceptions=False)
        self.current=self.requester

    def tearDown(self):fixtures.ReportsTest.tearDown(self)

    def create(self,kind='STOCK_ADJUSTMENT',values=None,draft=False,related=None):
        r=self.client.post('/workflows',json={'request_type':kind,'related_id':str(related or self.products[0].id),'requested_values':values or {'stock_quantity':25},'reason':'Increased demand','draft':draft})
        self.assertEqual(r.status_code,201,r.text)
        return r.json()

    def action(self,row,action,comment=None):
        return self.client.post('/workflows/'+row['id']+'/'+action,json={'comment':comment})

    def test_approve_updates_inventory_audit_notification_history_once(self):
        row=self.create()
        self.assertEqual(self.db.get(Product,self.products[0].id).stock_quantity,10)
        self.assertEqual(self.action(row,'approve').status_code,403)
        self.current=self.users[0]
        result=self.action(row,'approve','Confirmed counted stock')
        self.assertEqual(result.status_code,200,result.text)
        inv=self.db.scalar(select(Inventory).where(Inventory.product_id==self.products[0].id))
        self.assertEqual((inv.current_stock,inv.available_stock,self.products[0].stock_quantity),(25,25,25))
        self.assertEqual(self.action(row,'approve').status_code,409)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(InventoryMovement).where(InventoryMovement.remarks=='Approval '+row['id'])),1)
        history=self.client.get('/workflows/'+row['id']+'/history').json()
        self.assertIn('APPROVED',[h['action'] for h in history]);self.assertIn('APPLIED',[h['action'] for h in history])
        notes=self.db.scalars(select(Notification).where(Notification.type=='WORKFLOW_ALERT')).all()
        self.assertTrue(any(n.user_id==self.requester.id and 'approved' in n.title for n in notes))
        self.assertTrue(self.db.scalar(select(QualityChange.id).where(QualityChange.company_id==self.companies[0].id)))

    def test_tenant_isolation_and_configuration(self):
        row=self.create()
        self.current=self.users[1]
        for suffix in ('','/history'):
            self.assertEqual(self.client.get('/workflows/'+row['id']+suffix).status_code,404)
        self.assertEqual(self.action(row,'approve').status_code,404)
        self.assertEqual(self.client.get('/workflows').json()['total'],0)
        self.assertEqual(self.client.post('/workflows',json={'request_type':'STOCK_ADJUSTMENT','related_id':str(self.products[0].id),'requested_values':{'stock_quantity':30},'reason':'Foreign company'}).status_code,404)
        r=self.client.put('/workflows/config/STOCK_ADJUSTMENT',json={'approver_role':'ANALYST','allow_self_approval':True})
        self.assertEqual(r.status_code,200,r.text)
        self.current=self.users[0]
        self.assertEqual(self.client.get('/workflows/config').json()[0]['approverRole'],'COMPANY_ADMIN')
        self.current=self.requester
        self.assertEqual(self.client.put('/workflows/config/STOCK_ADJUSTMENT',json={'approver_role':'ANALYST'}).status_code,403)

    def test_approver_availability_and_explicit_admin_recovery(self):
        def availability():
            rows = self.client.get('/workflows/config').json()
            return next(c for c in rows if c['requestType'] == 'STOCK_ADJUSTMENT')['eligibleApproverCount']
        self.assertEqual(availability(), 1)
        self.current = self.users[0]
        self.assertEqual(availability(), 0)
        response = self.client.post('/workflows', json={
            'request_type': 'STOCK_ADJUSTMENT', 'related_id': str(self.products[0].id),
            'requested_values': {'stock_quantity': 25}, 'reason': 'Counted stock'})
        self.assertEqual(response.status_code, 409, response.text)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(ApprovalRequest)), 0)
        draft = self.create(draft=True)
        response = self.client.put('/workflows/config/STOCK_ADJUSTMENT', json={
            'approver_role': 'COMPANY_ADMIN', 'allow_self_approval': True})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(availability(), 1)
        self.assertEqual(self.action(draft, 'submit').status_code, 200)
        self.assertEqual(self.action(draft, 'approve').status_code, 200)

    def test_rejection_cancel_and_drafts(self):
        row=self.create(draft=True)
        self.assertEqual(row['status'],'DRAFT')
        self.current=self.users[0]
        self.assertEqual(self.action(row,'approve').status_code,409)
        self.assertEqual(self.action(row,'submit').status_code,403)
        self.current=self.requester
        self.assertEqual(self.action(row,'submit').status_code,200)
        self.current=self.users[0]
        self.assertEqual(self.action(row,'reject','  ').status_code,422)
        self.assertEqual(self.action(row,'reject','Insufficient evidence').status_code,200)
        self.assertEqual(self.action(row,'approve').status_code,409)
        self.current=self.requester
        other=self.create()
        self.assertEqual(self.action(other,'cancel').status_code,200)
        self.current=self.users[0]
        self.assertEqual(self.action(other,'approve').status_code,409)
        self.assertEqual(self.products[0].stock_quantity,10)

    def test_stale_record_and_atomic_rollback(self):
        row=self.create()
        self.products[0].stock_quantity=12
        inv=self.db.scalar(select(Inventory).where(Inventory.product_id==self.products[0].id));inv.current_stock=12;inv.available_stock=12
        self.db.commit()
        self.current=self.users[0]
        self.assertEqual(self.action(row,'approve').status_code,409)
        self.assertEqual(self.db.get(ApprovalRequest,UUID(row['id'])).status,'PENDING_APPROVAL')
        self.current=self.requester
        fresh=self.create()
        self.current=self.users[0]
        with patch('app.services.workflow_service.notify',side_effect=RuntimeError('notification failure')):
            self.assertEqual(self.action(fresh,'approve').status_code,500)
        self.assertEqual(self.db.get(ApprovalRequest,UUID(fresh['id'])).status,'PENDING_APPROVAL')
        self.assertEqual(self.products[0].stock_quantity,12)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(ApprovalHistory).where(ApprovalHistory.request_id==UUID(fresh['id']),ApprovalHistory.action=='APPROVED')),0)

    def test_price_deactivation_and_self_approval_configuration(self):
        row=self.create('PRODUCT_PRICE_CHANGE',{'unit_price':'150.00'})
        self.current=self.users[0]
        self.assertEqual(self.action(row,'approve').status_code,200)
        self.assertEqual(float(self.products[0].unit_price),150)
        self.current=self.requester
        row=self.create('PRODUCT_DEACTIVATION',{'status':'INACTIVE'})
        self.current=self.users[0]
        self.assertEqual(self.action(row,'approve').status_code,200)
        self.assertEqual(self.products[0].status,'INACTIVE')
        self.client.put('/workflows/config/STOCK_ADJUSTMENT',json={'approver_role':'ANALYST','allow_self_approval':True})
        self.current=self.requester
        row=self.create()
        self.assertEqual(self.action(row,'approve').status_code,200)

    def test_direct_api_cannot_bypass_and_validation(self):
        r=self.client.post('/inventory/adjustments',json={'productId':str(self.products[0].id),'adjustmentType':'MANUAL_ADJUSTMENT','quantity':30,'reason':'Counted stock'})
        self.assertEqual(r.status_code,409,r.text)
        r=self.client.delete('/products/'+str(self.products[0].id));self.assertEqual(r.status_code,409,r.text)
        for values in ({'stock_quantity':-1},{'stock_quantity':1.5},{'stock_quantity':25,'company_id':'foreign'}):
            r=self.client.post('/workflows',json={'request_type':'STOCK_ADJUSTMENT','related_id':str(self.products[0].id),'requested_values':values,'reason':'Test validation'})
            self.assertEqual(r.status_code,422,r.text)

    def test_customer_change_validation_and_sales_integration(self):
        customer=self.customers[0]
        customer.email='customer@example.com';customer.phone='9876543210';customer.customer_type='RETAIL';self.db.commit()
        row=self.create('CUSTOMER_INFORMATION_CHANGE',{'full_name':'Updated Customer','city':'Mumbai'},related=customer.id)
        self.assertEqual(customer.full_name,'Customer 0')
        self.current=self.users[0]
        result=self.action(row,'approve')
        self.assertEqual(result.status_code,200,result.text)
        self.assertEqual(customer.full_name,'Updated Customer')
        from app.models.sales import Sale
        self.assertEqual(self.db.scalar(select(Sale.customer_name).where(Sale.customer_id==customer.id)),'Updated Customer')

    def test_import_held_released_and_cancelled(self):
        from app.services import bulk_import_service as imports
        from app.services import workflow_service as workflows
        from app.models.bulk_import import BulkImportJob
        from sqlalchemy.orm import sessionmaker
        content=b'SKU,Current Stock,Reorder Level\nSKU0,40,8\n'
        job=imports.enqueue(self.db,self.requester,'inventory','stock.csv',content,uuid4(),'New warehouse count')
        self.assertEqual(job.status,'Awaiting Approval')
        factory=sessionmaker(self.engine,expire_on_commit=False)
        self.assertIsNone(imports.claim_next(factory))
        row=self.db.scalar(select(ApprovalRequest).where(ApprovalRequest.related_id==job.id))
        self.current=self.users[0]
        result=self.action({'id':str(row.id)},'approve')
        self.assertEqual(result.status_code,200,result.text)
        self.db.refresh(job);self.assertEqual(job.status,'Uploaded')
        self.assertEqual(self.products[0].stock_quantity,10)
        self.assertTrue(imports.run_once(factory));self.db.expire_all()
        self.assertEqual(self.products[0].stock_quantity,40)
        self.assertEqual(self.db.get(BulkImportJob,job.id).status,'Completed')
        second=imports.enqueue(self.db,self.requester,'inventory','stock.csv',content,uuid4(),'Recount stock')
        request=self.db.scalar(select(ApprovalRequest).where(ApprovalRequest.related_id==second.id))
        self.current=self.requester
        self.assertEqual(self.action({'id':str(request.id)},'cancel').status_code,200)
        self.db.refresh(second);self.assertEqual(second.status,'Cancelled')
        self.assertIsNone(imports.claim_next(factory))

    def test_no_approval_rule_applies_atomically(self):
        self.current=self.users[0]
        self.client.put('/workflows/config/STOCK_ADJUSTMENT',json={'approver_role':'COMPANY_ADMIN','approval_required':False})
        self.current=self.requester
        row=self.create()
        self.assertEqual(row['status'],'APPROVED')
        self.assertEqual(self.products[0].stock_quantity,25)

if __name__=='__main__':unittest.main()
