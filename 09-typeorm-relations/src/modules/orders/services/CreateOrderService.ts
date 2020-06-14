import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IProductOrder {
  product_id: string;
  price: number;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Costumer not exist');
    }

    let productsFromDb = await this.productsRepository.findAllById(products);

    if (productsFromDb.length !== products.length) {
      throw new AppError('Invalid products');
    }

    const productsOrder: IProductOrder[] = [];

    productsFromDb = productsFromDb.map((product, index) => {
      const finalQuantity = product.quantity - products[index].quantity;

      if (finalQuantity < 0) {
        throw new AppError(
          `Insufficient quantity for product: ${products[index].id}`,
        );
      }

      product.quantity = finalQuantity;

      productsOrder.push({
        product_id: products[index].id,
        price: product.price,
        quantity: products[index].quantity,
      });

      return product;
    });

    this.productsRepository.updateQuantity(productsFromDb);

    return this.ordersRepository.create({
      customer,
      products: productsOrder,
    });
  }
}

export default CreateOrderService;
