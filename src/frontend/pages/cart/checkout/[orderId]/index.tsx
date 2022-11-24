import { faro } from '@grafana/faro-web-sdk';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Ad from '../../../../components/Ad';
import Button from '../../../../components/Button';
import CheckoutItem from '../../../../components/CheckoutItem';
import Footer from '../../../../components/Footer';
import Layout from '../../../../components/Layout';
import Recommendations from '../../../../components/Recommendations';
import AdProvider from '../../../../providers/Ad.provider';
import * as S from '../../../../styles/Checkout.styled';
import { IProductCheckout } from '../../../../types/Cart';

const Checkout: NextPage = () => {
  const { query } = useRouter();
  const { items = [], shippingAddress } = JSON.parse((query.order || '{}') as string) as IProductCheckout;

  useEffect(() => {
    faro.api.pushEvent('page', {
      'name': 'checkout/[orderId]',
      'orderId': query.orderId as string,
    });
  });

  return (
    <AdProvider
      productIds={items.map(({ item }) => item?.productId || '')}
      contextKeys={[...new Set(items.flatMap(({ item }) => item.product.categories))]}
    >
      <Layout>
        <S.Checkout>
          <S.Container>
            <S.Title>Your order is complete!</S.Title>
            <S.Subtitle>We&apos;ve sent you a confirmation email.</S.Subtitle>

            <S.ItemList>
              {items.map(checkoutItem => (
                <CheckoutItem
                  key={checkoutItem.item.productId}
                  checkoutItem={checkoutItem}
                  address={shippingAddress!}
                />
              ))}
            </S.ItemList>

            <S.ButtonContainer>
              <Link href="/">
                <Button type="submit">Continue Shopping</Button>
              </Link>
            </S.ButtonContainer>
          </S.Container>
          <Recommendations />
        </S.Checkout>
        <Ad />
        <Footer />
      </Layout>
    </AdProvider>
  );
};

export default Checkout;
