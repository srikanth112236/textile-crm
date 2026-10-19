import { mapCourierStatusToOrder, extractCourierStatus } from '../src/jobs/shipmentSync';
import { splitCustomerName } from '../src/services/shiprocket';
import { OrderStatus } from '../src/models/Order';

describe('Step 3 - shipment sync mapping', () => {
  it('delivered maps to DELIVERED', () => {
    expect(mapCourierStatusToOrder('Delivered', OrderStatus.SHIPPED)).toBe(OrderStatus.DELIVERED);
  });

  it('RTO/NDR never marks delivered and keeps order open', () => {
    expect(mapCourierStatusToOrder('RTO Delivered', OrderStatus.SHIPPED)).toBeNull();
    expect(mapCourierStatusToOrder('NDR - consignee unavailable', OrderStatus.SHIPPED)).toBeNull();
    expect(mapCourierStatusToOrder('Undelivered', OrderStatus.OUT_FOR_DELIVERY)).toBeNull();
    expect(mapCourierStatusToOrder('Shipment Cancelled', OrderStatus.SHIPPED)).toBeNull();
  });

  it('delivered is terminal - no backwards moves on out-of-order events', () => {
    expect(mapCourierStatusToOrder('In Transit', OrderStatus.DELIVERED)).toBeNull();
    expect(mapCourierStatusToOrder('Shipped', OrderStatus.DELIVERED)).toBeNull();
  });

  it('in-transit / OFD / pickup map forward', () => {
    expect(mapCourierStatusToOrder('Out For Delivery', OrderStatus.SHIPPED)).toBe(OrderStatus.OUT_FOR_DELIVERY);
    expect(mapCourierStatusToOrder('In Transit', OrderStatus.PACKED)).toBe(OrderStatus.SHIPPED);
    expect(mapCourierStatusToOrder('Picked Up', OrderStatus.PROCESSING)).toBe(OrderStatus.PACKED);
  });

  it('extracts status from awb-track shape', () => {
    const r = extractCourierStatus({ tracking_data: { shipment_track: [{ current_status: 'Delivered', awb_code: '123', courier_name: 'Delhivery', etd: '2026-01-01' }] } });
    expect(r.status).toBe('Delivered');
    expect(r.awb).toBe('123');
    expect(r.courier).toBe('Delhivery');
  });

  it('extracts status from shipment-track shape', () => {
    const r = extractCourierStatus({ tracking_data: { current_status: 'In Transit' } });
    expect(r.status).toBe('In Transit');
  });

  it('splits customer names for Shiprocket first/last fields', () => {
    expect(splitCustomerName('Rahul Sharma')).toEqual({ first: 'Rahul', last: 'Sharma' });
    expect(splitCustomerName('Rahul Kumar Sharma')).toEqual({ first: 'Rahul Kumar', last: 'Sharma' });
    expect(splitCustomerName('Rahul')).toEqual({ first: 'Rahul', last: '' });
    expect(splitCustomerName('')).toEqual({ first: 'Mentoos', last: 'Customer' });
  });
});
