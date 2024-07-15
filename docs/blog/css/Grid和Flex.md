# Flex 和 Grid 布局

```text
grid 和 flex 各自的应用场景。

1. 要考虑 一维布局 还是 二维布局
 一般来说 一维布局 使用 flex  ， 二维布局使用 grid.
2. 根据布局角度出发，是根据 内容布局 还是 页面布局
 内容布局：内容不固定，使用 flex
 页面布局： 页面布局固定， 使用 grid
```

## Flex


## Grid


## 结合

使用 react 和 emation 开发。

```js
import styled from "@emotion/styled";

export const AuthicatedApp = () => {
  const logout = () => {
    console.log();
  };
  return (
    <Container>
      <Header>
        <HeaderLeft>
          <h3>Logo</h3>
          <h3>项目</h3>
          <h3>用户</h3>
        </HeaderLeft>
        <HeaderRight>
          <button onClick={logout}>登出</button>
        </HeaderRight>
      </Header>
      <Nav>nav</Nav>
      <Main>main</Main>
      <Aside>aside</Aside>
      <Footer>footer</Footer>
    </Container>
  );
};
/**
 * grid 和 flex 各自的应用场景。
 * 1、 要考虑 一维布局 还是 二维布局
 * 一般来说 一维布局 使用 flex  ， 二维布局使用 grid
 *
 * 2、 根据布局角度出发，是根据 内容布局 还是 页面布局
 * 内容布局：内容不固定，使用 flex
 * 页面布局： 页面布局固定， 使用
 */

const Container = styled.div`
  display: grid;
  grid-template-rows: 6rem 1fr 6rem;
  grid-template-columns: 10rem 1fr 10rem;
  grid-template-areas:
    "header header header"
    "nav main aside"
    "footer footer footer";
  grid-gap: 1rem;
  height: 100vh;
`;

const Header = styled.header`
  grid-area: header;
  display: flex;
  flex-direction: row;
  align-items: top;
  justify-content: space-between;
`;
const HeaderLeft = styled.div`
  display: flex;
  flex-direction: row;
`;
const HeaderRight = styled.div``;
const Main = styled.main`
  grid-area: main;
`;
const Nav = styled.nav`
  grid-area: nav;
`;

const Aside = styled.aside`
  grid-area: aside;
`;

const Footer = styled.footer`
  grid-area: footer;
`;
```
