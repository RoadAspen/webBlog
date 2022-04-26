// import _ from 'lodash';
import './index.css';
function component() {
    // console.log(_.join([1, 2, 3], 6543))
    let element = document.createElement("div");

    element.innerHTML = "Hello Webpack";

    document.body.appendChild(element);
}
component();