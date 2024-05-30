import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Luv2ShopFormService} from "../../services/luv2-shop-form.service";
import {Country} from "../../common/country";
import {State} from "../../common/state";
import {Luv2ShopValidators} from "../../validators/luv2-shop-validators";

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

  constructor(private formBuilder: FormBuilder,
              private luv2ShopFormService: Luv2ShopFormService
  ) {
  }

  ngOnInit(): void {

    this.checkedOutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('',
          [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        lastName: new FormControl('', [Validators.required, Validators.minLength(2), Luv2ShopValidators.notOnlyWhitespace]),
        email: new FormControl('', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
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
    }
    console.log(this.checkedOutFormGroup.get('customer')?.value);
    console.log(this.checkedOutFormGroup.get('customer')?.get('email')?.value);

    console.log("The shipping address country is " + this.checkedOutFormGroup.get('shippingAddress')?.value.country.name);
    console.log("The shipping address state is " + this.checkedOutFormGroup.get('shippingAddress')?.value.state.name);
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
}
