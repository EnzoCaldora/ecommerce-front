import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Luv2ShopFormService} from "../../services/luv2-shop-form.service";
import {Country} from "../../common/country";
import {State} from "../../common/state";
import {Luv2ShopValidators} from "../../validators/luv2-shop-validators";
import {CartService} from "../../services/cart.service";
import {Router} from "@angular/router";
import {CheckoutService} from "../../services/checkout.service";
import {Order} from "../../common/order";
import {OrderItem} from "../../common/order-item";
import {Purchase} from "../../common/purchase";

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  checkedOutFormGroup!: FormGroup;


  totalPrice: number = 0;
  totalQuantity: number = 0;

  theCreditCardYears: number[] = [];
  theCreditCardMonths: number[] = [];

  countries: Country[] = [];

  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  storage: Storage = sessionStorage;

  constructor(private formBuilder: FormBuilder,
              private luv2ShopFormService: Luv2ShopFormService,
              private cartService: CartService,
              private checkoutService: CheckoutService,
              private router: Router
  ) {
  }

  ngOnInit(): void {

    this.reviewCartDetails();

    // read the user's email address from browser storage
    const theEmail = JSON.parse(this.storage.getItem('userEmail')!);

    this.checkedOutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        lastName: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        email: new FormControl(theEmail, [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        city: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace])
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        city: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace])
      }),
      creditCard: this.formBuilder.group({
        cardType: new FormControl('', [Validators.required]),
        nameOnCard: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        cardNumber: new FormControl('', [Validators.required, Validators.pattern('[0-9]{16}')]),
        securityCode: new FormControl('', [Validators.required, Validators.pattern('[0-9]{3}')]),
        expirationMonth: [''],
        expirationYear: ['']
      })
    })

    // populate credit card months
    const startMonth: number = new Date().getMonth() + 1;
    console.log("startMonth: " + startMonth);

    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.theCreditCardMonths = data;
      }
    );
    // populate credit card years

    this.luv2ShopFormService.getCreditCardYears().subscribe(
      data => {
        console.log("Retrieved credit card years: " + JSON.stringify(data));
        this.theCreditCardYears = data;
      }
    );

    // populate countries
    this.luv2ShopFormService.getCountries().subscribe(
      data => {
        console.log("Retrieved countries: " + JSON.stringify(data));
        this.countries = data;
      }
    );

  }

  onSubmit() {
    console.log("Handling the submit button");

    if (this.checkedOutFormGroup.invalid) {
      this.checkedOutFormGroup.markAllAsTouched();
      return;
    }

    // Set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    // Get cart items
    const cartItems = this.cartService.cartItems;

    // Create orderItems from cartItems
    let orderItems: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    // Set up purchase
    let purchase = new Purchase();

    // Populate purchase - customer
    purchase.customer = this.checkedOutFormGroup.controls['customer'].value;

    // Populate purchase - shipping address
    purchase.shippingAddress = this.checkedOutFormGroup.controls['shippingAddress'].value;

    const shippingState = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify((purchase.shippingAddress.country)));

    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    // Populate purchase - billing address
    purchase.billingAddress = this.checkedOutFormGroup.controls['billingAddress'].value;

    const billingState: State = JSON.parse(JSON.stringify((purchase.billingAddress.state)));
    const billingCountry: Country = JSON.parse(JSON.stringify((purchase.billingAddress.country)));

    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    // Populate purchase - order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItems;

    // Call REST API via the CheckoutService
    this.checkoutService.placeOrder(purchase).subscribe({

      next: response => {

        alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);

        // reset cart
        this.resetCart();

      },
      error: error => {
        alert(`There was an error: ${error.message}`);
      }
    });

  }


  // Define getters for form controls

  //  customer getters
  get firstName() {
    return this.checkedOutFormGroup.get('customer.firstName');
  }

  get lastName() {
    return this.checkedOutFormGroup.get('customer.lastName');
  }

  get email() {
    return this.checkedOutFormGroup.get('customer.email');
  }

  // shipping address getters

  get shippingAddressStreet() {
    return this.checkedOutFormGroup.get('shippingAddress.street');
  }

  get shippingAddressCity() {
    return this.checkedOutFormGroup.get('shippingAddress.city');
  }

  get shippingAddressState() {
    return this.checkedOutFormGroup.get('shippingAddress.state');
  }

  get shippingAddressCountry() {
    return this.checkedOutFormGroup.get('shippingAddress.country');
  }

  get shippingAddressZipCode() {
    return this.checkedOutFormGroup.get('shippingAddress.zipCode');
  }

  // billing address getters
  get billingAddressStreet() {
    return this.checkedOutFormGroup.get('billingAddress.street');
  }

  get billingAddressCity() {
    return this.checkedOutFormGroup.get('billingAddress.city');
  }

  get billingAddressState() {
    return this.checkedOutFormGroup.get('billingAddress.state');
  }

  get billingAddressCountry() {
    return this.checkedOutFormGroup.get('billingAddress.country');
  }

  get billingAddressZipCode() {
    return this.checkedOutFormGroup.get('billingAddress.zipCode');
  }

  // credit card getters
  get creditCardType() {
    return this.checkedOutFormGroup.get('creditCard.cardType');
  }

  get creditCardNameOnCard() {
    return this.checkedOutFormGroup.get('creditCard.nameOnCard');
  }

  get creditCardNumber() {
    return this.checkedOutFormGroup.get('creditCard.cardNumber');
  }

  get creditCardSecurityCode() {
    return this.checkedOutFormGroup.get('creditCard.securityCode');
  }

  copyShippingToBilling(event: Event) {

    if ((event.target as HTMLInputElement).checked) {
      this.checkedOutFormGroup.controls['billingAddress']
        .setValue(this.checkedOutFormGroup.controls['shippingAddress'].value)

      // bug fix for states
      this.billingAddressStates = this.shippingAddressStates;
    } else {
      this.checkedOutFormGroup.controls['billingAddress'].reset();

      // bug fix for states
      this.billingAddressStates = [];
    }
  }

  handleMonthAndYears() {

    const creditCardFormGroup = this.checkedOutFormGroup.get('creditCard');

    const currentYear = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup?.value.expirationYear);

    //if the current year equals the selected year, then start with the current month
    let startMonth: number;
    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    } else {
      startMonth = 1;
    }

    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.theCreditCardMonths = data;
      }
    );
  }

  getStates(formGroupName: string) {

    const formGroup = this.checkedOutFormGroup.get(formGroupName);

    const countryCode = formGroup!.value.country.code;
    const countryName = formGroup!.value.country.name;

    console.log(`${formGroupName} country code: ${countryCode}`);
    console.log(`${formGroupName} country name: ${countryName}`);

    this.luv2ShopFormService.getStates(countryCode).subscribe(
      data => {

        if (formGroupName === 'shippingAddress') {
          this.shippingAddressStates = data;
        } else {
          this.billingAddressStates = data;
        }
        // select first item by default
        formGroup?.get('state')?.setValue(data[0]);
      }
    );
  }

  private reviewCartDetails() {

    // subscribe to cartService.totalQuantity
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity
    )

    // subscribe to cartService.totalPrice
    this.cartService.totalPrices.subscribe(
      totalPrice => this.totalPrice = totalPrice
    )

  }

  private resetCart() {

    // reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrices.next(0);
    this.cartService.totalQuantity.next(0);

    // reset form data
    this.checkedOutFormGroup.reset();

    // navigate back to the products
    this.router.navigateByUrl("/products");
  }
}
