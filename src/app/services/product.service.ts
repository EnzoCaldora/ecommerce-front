import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {Product} from "../common/product";
import {ProductCategory} from "../common/product-category";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private baseUrl = environment.luv2shopApiUrl + '/products';

  private categoryUrl = environment.luv2shopApiUrl + '/product-category';


  constructor(private httpClient: HttpClient) {
  }

  private getProducts(searchUrl: string) {
    return this.httpClient.get<GetResponseProduct>(searchUrl).pipe(
      map(response => response._embedded.products));
  }


  getProductList(theCategoryId: number): Observable<Product[]> {

    // need to build URL based on category id
    const searchUrl = `${this.baseUrl}/search/findByCategoryId?id=${theCategoryId}`;
    return this.getProducts(searchUrl);
  }

  getProductListPaginate(thePage: number, thePageSize: number, theCategoryId: number): Observable<GetResponseProduct> {

    // need to build URL based on category id, page and size
    const searchUrl = `${this.baseUrl}/search/findByCategoryId?id=${theCategoryId}`
      + `&page=${thePage}&size=${thePageSize}`;
    return this.httpClient.get<GetResponseProduct>(searchUrl);
  }

  searchProductsPaginate(thePage: number, thePageSize: number, theKeyword: string): Observable<GetResponseProduct> {

    // need to build URL based on keyword, page and size
    const searchUrl = `${this.baseUrl}/search/findByNameContaining?name=${theKeyword}`
      + `&page=${thePage}&size=${thePageSize}`;
    return this.httpClient.get<GetResponseProduct>(searchUrl);
  }


  getProductCategories(): Observable<ProductCategory[]> {

    return this.httpClient.get<GetResponseProductCategory>(this.categoryUrl).pipe(
      map(response => response._embedded.productCategory));
  }

  searchProducts(theKeyword: string): Observable<Product[]> {

    // need to build URL based on the keyword
    const searchUrl = `${this.baseUrl}/search/findByNameContaining?name=${theKeyword}`;

    return this.getProducts(searchUrl);
  }

  getProduct(theProductId: number): Observable<Product> {

    // Need to build URL based on product id
    const productUrl = `${this.baseUrl}/${theProductId}`;

    return this.httpClient.get<Product>(productUrl);

  }
}


interface GetResponseProduct {
  _embedded: {
    products: Product[];
  },
  page: {
    size: number,
    totalElements: number,
    totalPages: number,
    number: number
  }
}

interface GetResponseProductCategory {
  _embedded: {
    productCategory: ProductCategory[];
  }
}
