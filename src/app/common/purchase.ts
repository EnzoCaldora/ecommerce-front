import {Customer} from "./customer";
import {Address} from "./address";
import {OrderItem} from "./order-item";
import {Order} from "./order";

export class Purchase {
  public customer: Customer;
  public shippingAddress: Address;
  public billingAddress: Address;
  public order: Order;
  public orderItems: OrderItem[];

  constructor(customer?: Customer,
              shippingAddress?: Address,
              billingAddress?: Address,
              order?: Order,
              orderItems?: OrderItem[]) {
    this.customer = customer || new Customer();
    this.shippingAddress = shippingAddress || new Address();
    this.billingAddress = billingAddress || new Address();
    this.order = order || new Order();
    this.orderItems = orderItems || [];
  }
}
