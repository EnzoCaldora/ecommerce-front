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
import {environment} from "../../../environments/environment";
import {PaymentInfo} from "../../common/payment-info";

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  checkOutFormGroup!: FormGroup;


  totalPrice: number = 0;
  totalQuantity: number = 0;

  theCreditCardYears: number[] = [];
  theCreditCardMonths: number[] = [];

  countries: Country[] = [];

  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  storage: Storage = sessionStorage;

  // initialize Stripe API
  stripe = Stripe(environment.stripePublicKey);

  paymentInfo: PaymentInfo = new PaymentInfo();
  cardElement: any;
  displayError: any = '';

  isDisabled: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private luv2ShopFormService: Luv2ShopFormService,
              private cartService: CartService,
              private checkoutService: CheckoutService,
              private router: Router
  ) {
  }

  ngOnInit(): void {

    // Set up Stripe payment form
    this.setUpStripePayment();

    this.reviewCartDetails();

    // read the user's email address from browser storage
    // read the user's email address from browser storage
    let theEmail = this.storage.getItem('userEmail');
    if (theEmail) {
      theEmail = JSON.parse(theEmail);
    } else {
      console.log("No email found in storage")
    }

    this.checkOutFormGroup = this.formBuilder.group({
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
        /*
        cardType: new FormControl('', [Validators.required]),
        nameOnCard: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        cardNumber: new FormControl('', [Validators.required, Validators.pattern('[0-9]{16}')]),
        securityCode: new FormControl('', [Validators.required, Validators.pattern('[0-9]{3}')]),
        expirationMonth: [''],
        expirationYear: ['']
         */
      })
    })


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

    if (this.checkOutFormGroup.invalid) {
      this.checkOutFormGroup.markAllAsTouched();
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
    purchase.customer = this.checkOutFormGroup.controls['customer'].value;

    // Populate purchase - shipping address
    purchase.shippingAddress = this.checkOutFormGroup.controls['shippingAddress'].value;

    const shippingState = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify((purchase.shippingAddress.country)));

    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    // Populate purchase - billing address
    purchase.billingAddress = this.checkOutFormGroup.controls['billingAddress'].value;

    const billingState: State = JSON.parse(JSON.stringify((purchase.billingAddress.state)));
    const billingCountry: Country = JSON.parse(JSON.stringify((purchase.billingAddress.country)));

    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    // Populate purchase - order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItems;

    // compute payment info
    this.paymentInfo.amount = Math.round(this.totalPrice * 100);
    this.paymentInfo.currency = 'USD';
    this.paymentInfo.receiptEmail = purchase.customer.email;

    // if valid form then
    // - create payment intent
    // -confirm card payment
    // - place order

    if (!this.checkOutFormGroup.invalid && this.displayError.textContent === '') {

      this.isDisabled = true;
      this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe(
        (paymentIntentResponse) => {
          console.log("regarde ici " + JSON.stringify(paymentIntentResponse, null, 2));
          this.stripe.confirmCardPayment(paymentIntentResponse.client_secret, {
            payment_method: {
              card: this.cardElement,
              billing_details: {
                name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                email: purchase.customer.email,
                address: {
                  line1: purchase.billingAddress.street,
                  city: purchase.billingAddress.city,
                  state: purchase.billingAddress.state,
                  country: this.billingAddressCountry?.value.code,
                  postal_code: purchase.billingAddress.zipCode
                }
              }

            }
          }, {handleActions: false})
            .then((result: any) => {
              if (result.error) {
                //inform the customer there was an error
                alert(`There was an error: ${result.error.message}`);
                this.isDisabled = false;
              } else {
                // call REST API via checkout service
                this.checkoutService.placeOrder(purchase).subscribe({
                  next: (response: any) => {
                    alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);

                    // reset cart
                    this.resetCart();
                    this.isDisabled = false;
                  },
                  error: (err: any) => {
                    alert(`There was an error: ${err.message}`);
                    this.isDisabled = false;
                  }
                })
              }
            })
        }
      );
    } else {
      this.checkOutFormGroup.markAllAsTouched();
      return;
    }

  }

  // Define getters for form controls

  //  customer getters
  get firstName() {
    return this.checkOutFormGroup.get('customer.firstName');
  }

  get lastName() {
    return this.checkOutFormGroup.get('customer.lastName');
  }

  get email() {
    return this.checkOutFormGroup.get('customer.email');
  }

  // shipping address getters

  get shippingAddressStreet() {
    return this.checkOutFormGroup.get('shippingAddress.street');
  }

  get shippingAddressCity() {
    return this.checkOutFormGroup.get('shippingAddress.city');
  }

  get shippingAddressState() {
    return this.checkOutFormGroup.get('shippingAddress.state');
  }

  get shippingAddressCountry() {
    return this.checkOutFormGroup.get('shippingAddress.country');
  }

  get shippingAddressZipCode() {
    return this.checkOutFormGroup.get('shippingAddress.zipCode');
  }

  // billing address getters
  get billingAddressStreet() {
    return this.checkOutFormGroup.get('billingAddress.street');
  }

  get billingAddressCity() {
    return this.checkOutFormGroup.get('billingAddress.city');
  }

  get billingAddressState() {
    return this.checkOutFormGroup.get('billingAddress.state');
  }

  get billingAddressCountry() {
    return this.checkOutFormGroup.get('billingAddress.country');
  }

  get billingAddressZipCode() {
    return this.checkOutFormGroup.get('billingAddress.zipCode');
  }

  // credit card getters
  get creditCardType() {
    return this.checkOutFormGroup.get('creditCard.cardType');
  }

  get creditCardNameOnCard() {
    return this.checkOutFormGroup.get('creditCard.nameOnCard');
  }

  get creditCardNumber() {
    return this.checkOutFormGroup.get('creditCard.cardNumber');
  }

  get creditCardSecurityCode() {
    return this.checkOutFormGroup.get('creditCard.securityCode');
  }

  copyShippingToBilling(event: Event) {

    if ((event.target as HTMLInputElement).checked) {
      this.checkOutFormGroup.controls['billingAddress']
        .setValue(this.checkOutFormGroup.controls['shippingAddress'].value)

      // bug fix for states
      this.billingAddressStates = this.shippingAddressStates;
    } else {
      this.checkOutFormGroup.controls['billingAddress'].reset();

      // bug fix for states
      this.billingAddressStates = [];
    }
  }

  handleMonthAndYears() {

    const creditCardFormGroup = this.checkOutFormGroup.get('creditCard');

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

    const formGroup = this.checkOutFormGroup.get(formGroupName);

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
    this.checkOutFormGroup.reset();

    this.cartService.persistCartItems();

    // navigate back to the products
    this.router.navigateByUrl("/products");
  }

  private setUpStripePayment() {

    // Get a handle to stripe elements
    var elements = this.stripe.elements();

    // Create a card Element .. and Hide the zip code field
    this.cardElement = elements.create('card', {hidePostalCode: true});

    // Add an instance of card UI comopnent to the cardElement
    this.cardElement.mount('#card-element');

    // Handle real-time validation errors from the card Element
    this.cardElement.on('change', (event: any) => {

      // Get a handle to card-errors element
      this.displayError = document.getElementById('card-errors');

      if (event.complete) {

        this.displayError!.textContent = '';
      } else if (event.error) {

        this.displayError!.textContent = event.error.message;
      }

    });
  }
}
