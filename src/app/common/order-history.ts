export class OrderHistory {

  constructor(public id: string,
              public orderTrackingNumber: string,
              public totalQuantity: number,
              public totalPrice: number,
              public dateCreated: Date) {
  }
}
