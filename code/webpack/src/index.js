// import _ from 'lodash';
import './index.css';
import './index.scss';
// import _ from './lodash'
// import StopImg from './image/status_stop_cn.svg';
// import "@babel/polyfill";
function component() {
    // console.log(_.join([1, 2, 3], 6543))
    let element = document.createElement("div");

    element.innerHTML = "Hello Webpack";

    document.body.appendChild(element);
    console.log(12324444)

}
component();

// if (module.hot) {
//     module.hot.accept(() => {
//         component();
//     });
// }