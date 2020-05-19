// ==UserScript==
// @name         springdoc-openapi
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  swagger-ui 展开、折叠、搜索、方法定位
// @author       dairong
// @include      *://*/swagger-ui/index.html
// @include      *://*/swagger-ui/index.html?*
// @include      *://*/*swagger-ui/index.html*
// @grant        none
// ==/UserScript==

(function (config) {
    'use strict';
    let buttonText = config.buttonText || '复制'
    let buttonColor = config.buttonColor || ' #49cc90'
    let buttonString = `<div class="mybutton" style="background:${buttonColor};font-size: 14px;font-weight: 700;min-width: 80px;padding: 6px 15px;text-align: center;border-radius: 3px;text-shadow: 0 1px 0 rgba(0,0,0,.1);color: #fff;">${buttonText}</div>`;

    // next tick
    function nextTick(fn, time = 50) {
        setTimeout(() => {
            let isFunction = Object.prototype.toString.call(fn) === "[object Function]"
            if (isFunction) {
                fn();
            }
        }, time)
    }

    // button
    function getButton() {
        const divElement = document.createElement("div");
        divElement.innerHTML = buttonString
        return divElement
    }

    // 按钮点击事件
    function buttonClick(e) {
        try {
            const pathElement = e.target.parentElement.parentElement.querySelector('.opblock-summary-path');
            const path = pathElement.getAttribute('data-path');
            window.copyToClipboard(path);
        } catch (error) {

        }
        e.stopPropagation();
    }

    // 追加按钮
    function appendButton(ele) {
        const baseElement = ele || document
        const paths = baseElement.querySelectorAll('.opblock-summary')
        paths.forEach(item => {
            const buttonElement = getButton();
            buttonElement.onclick = buttonClick
            item.appendChild(buttonElement)
        })
    }

    // controller 点击
    function opblockTagClick(e) {
        const currentElement = e.target
        const controllerElement = currentElement.parentElement
        const className = controllerElement.className
        nextTick(() => {
            appendButton(controllerElement);
        });
    }

    // 兼容 controller 展开、折叠 追加的按钮消失问题
    function handleOpblockTagClick() {
        const opblockTags = document.querySelectorAll('.opblock-tag');
        opblockTags.forEach(item => {
            item.onclick = opblockTagClick
        })
    }

    // <script src="https://wzrd.in/standalone/copy-to-clipboard@latest" async></script>
    function clipboard() {
        let script = document.createElement("script");
        script.type = "text/javascript";
        script.src = 'https://wzrd.in/standalone/copy-to-clipboard@latest'
        script.async = true
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    // 初始化
    function init() {
        appendButton();
        handleOpblockTagClick();
    }

    // swagger 异步加载，定时器捕获页面元素
    let timer = setInterval(() => {
        const paths = document.querySelectorAll('.opblock-summary');
        if (!paths || paths.length === 0) {
            return;
        }
        clearInterval(timer);
        console.group();
        console.log('页面加载完成！');
        console.log('开始初始化插件。');
        clipboard();
        init();
        console.log('插件初始化完成。');
        console.groupEnd();
    }, 500);

})({
    buttonText: '复制',
    buttonColor: '#49cc90'
});