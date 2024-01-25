import http from 'k6/http';
import { check, sleep } from 'k6';
import { browser } from 'k6/experimental/browser';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.0/index.js'

import people from './people.json';

const categories = [
    'binoculars',
    'telescopes',
    'accessories',
    'assembly',
    'travel',
    'books',
    null,
]

const products = [
    '0PUK6V6EV0',
    '1YMWWN1N4O',
    '2JAZZY3GM2N',
    '66VCHSJNUP',
    '6E92ZMYYFZ',
    '9SIQT8TOJO',
    'L9ECAV7KIM',
    'LS4PSXUNUM',
    'OLJCESPC7Z',
    'HQTGWGPNH4',
]

const currencies = [
    'USD',
    'EUR',
    'JPY',
    'CAD',
    'AUD',
    'GBP',
    'CHF',
]

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            iterations: 200,
            options: {
                browser: {
                    type: 'chromium',
                },
            },
        },
        api: {
            exec: 'api',
            executor: 'shared-iterations',
            iterations: 200,
        }
    },
    thresholds: {
        checks: ["rate==1.0"]
    }
}

export class Homepage {
    constructor(page) {
        this.page = page;
    }

    async goto() {
        await this.page.goto(__ENV.WEB_HOST);
    }

    selectRandomProduct() {
        const productToFind = Math.floor(Math.random() * 10) + 1;
        this.page.locator(`div[data-cy="product-list"] div[data-cy="product-card"]:nth-child(${productToFind})`).click();
    }

    numberOfProducts() {
        return this.page.$$('div[data-cy="product-list"] div[data-cy="product-card"]').length;
    }

    async waitForProductList() {
        await this.page.waitForSelector('div[data-cy="product-list"]');
    }
}

export class ProductDetailPage {
    constructor(page) {
        this.page = page;
        this.addToCartButton = this.page.locator('button[data-cy="product-add-to-cart"]');
    }

    addToCart() {
        this.addToCartButton.click();
    }

    async goto(productId) {
        await this.page.goto(`${__ENV.WEB_HOST}/product/${productId}`);
    }
}

export class CheckoutPage {
    constructor(page) {
        this.page = page;
        this.checkoutButton = this.page.locator('button[data-cy="checkout-place-order"]');
    }

    async goto() {
        await this.page.goto(`${__ENV.WEB_HOST}/cart`);
    }

    performCheckout() {
        this.checkoutButton.click();
    }
}

export default async function () {
    const context = browser.newContext();
    context.setDefaultTimeout(15000);
    const page = context.newPage();

    try {
        const homepage = new Homepage(page);
        await homepage.goto();
        await homepage.waitForProductList();

        expect(homepage.numberOfProducts()).to.be.above(0);

        homepage.selectRandomProduct();
        sleep(1);

        const productDetailPage = new ProductDetailPage(page);
        await productDetailPage.goto(products[Math.floor(Math.random() * products.length)]);
        productDetailPage.addToCart();
        sleep(1);

        const checkoutPage = new CheckoutPage(page);
        await checkoutPage.goto();
        checkoutPage.performCheckout();
        await page.goto(page.url());
        sleep(1);
    } finally {
        context.close();
    }
}

export function api() {
    http.get(`${__ENV.WEB_HOST}`);

    // random category
    const category = categories[Math.floor(Math.random() * categories.length)];

    // random product
    const product = products[Math.floor(Math.random() * products.length)];

    http.get(`${__ENV.WEB_HOST}/api/products/${product}`);

    // load recommendations
    const queryParams = {
        productIds: [
            products[Math.floor(Math.random() * products.length)]
        ],
    }
    http.get(`${__ENV.WEB_HOST}/api/recommendations`, { queryParams });

    // get ads
    const adQueryParams = {
        "contextKeys": [
            categories[Math.floor(Math.random() * categories.length)],
        ],
    }
    http.get(`${__ENV.WEB_HOST}/api/ads`, { queryParams: adQueryParams });

    // view cart
    http.get(`${__ENV.WEB_HOST}/api/cart`);

    // add to cart
    const productForCart = products[Math.floor(Math.random() * products.length)];
    http.get(`${__ENV.WEB_HOST}/api/products/${productForCart}`);
    const cart_item = {
        "item": {
            "productId": productForCart,
            "quantity": Math.floor(Math.random() * 10) + 1,
        },
        "userId": Math.floor(Math.random() * people.length),
    }
    http.post(`${__ENV.WEB_HOST}/api/cart`, cart_item, { headers: { "Content-Type": "application/json" } });
}
