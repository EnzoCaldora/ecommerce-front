import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ProductListComponent} from "./components/product-list/product-list.component";
import {ProductDetailsComponent} from "./components/product-details/product-details.component";

const routes: Routes = [
  {path: 'search/:keyword', component: ProductListComponent},
  {path: 'category/:id/:name', component: ProductListComponent},
  {path: 'products/:id', component: ProductDetailsComponent},
  { path: 'category', component: ProductListComponent},
  { path: 'products', component: ProductListComponent},
  { path: '', redirectTo: '/products', pathMatch: 'full'},
  { path: '**', redirectTo: '/products', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }