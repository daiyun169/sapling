// ==UserScript==
// @name         springdoc-openapi
// @namespace    http://tampermonkey.net/
// @version      0.4
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

    // toast
    function getToast() {
        return 'function _toast(msg,duration){duration=isNaN(duration)?3000:duration;var m=document.createElement("div");m.innerHTML=msg;m.style.cssText="font-family:siyuan;max-width:60%;min-width: 150px;padding:0 14px;height: 40px;color: rgb(255, 255, 255);line-height: 40px;text-align: center;border-radius: 4px;position: fixed;top: 50%;left: 50%;transform: translate(-50%, -50%);z-index: 999999;background: rgba(0, 0, 0,.7);font-size: 16px;";document.body.appendChild(m);setTimeout(function(){var d=0.5;m.style.webkitTransition="-webkit-transform "+d+"s ease-in, opacity "+d+"s ease-in";m.style.opacity="0";setTimeout(function(){document.body.removeChild(m)},d*1000)},duration)};'
    }

    // add toast
    function appendToast() {
        let script = document.createElement("script");
        script.innerHTML = getToast()
        document.getElementsByTagName('head')[0].appendChild(script);
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
            const title = document.querySelector('.information-container .title').innerText
            const pathElement = e.target.parentElement.parentElement.querySelector('.opblock-summary-path');
            const path = pathElement.getAttribute('data-path');
            const copyData = `/${title.trim()}${path.trim()}`
            window.copyToClipboard(copyData);
            _toast('复制成功', 1200);
        } catch (error) {
            console.error(error)
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
        script.innerHTML = `!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).copyToClipboard=e()}}(function(){return function(){return function e(t,n,o){function r(a,i){if(!n[a]){if(!t[a]){var u="function"==typeof require&&require;if(!i&&u)return u(a,!0);if(c)return c(a,!0);var l=new Error("Cannot find module '"+a+"'");throw l.code="MODULE_NOT_FOUND",l}var s=n[a]={exports:{}};t[a][0].call(s.exports,function(e){return r(t[a][1][e]||e)},s,s.exports,e,t,n,o)}return n[a].exports}for(var c="function"==typeof require&&require,a=0;a<o.length;a++)r(o[a]);return r}}()({1:[function(e,t,n){"use strict";var o=e("toggle-selection"),r="Copy to clipboard: #{key}, Enter";t.exports=function(e,t){var n,c,a,i,u,l,s=!1;t||(t={}),n=t.debug||!1;try{if(a=o(),i=document.createRange(),u=document.getSelection(),(l=document.createElement("span")).textContent=e,l.style.all="unset",l.style.position="fixed",l.style.top=0,l.style.clip="rect(0, 0, 0, 0)",l.style.whiteSpace="pre",l.style.webkitUserSelect="text",l.style.MozUserSelect="text",l.style.msUserSelect="text",l.style.userSelect="text",document.body.appendChild(l),i.selectNode(l),u.addRange(i),!document.execCommand("copy"))throw new Error("copy command was unsuccessful");s=!0}catch(o){n&&console.error("unable to copy using execCommand: ",o),n&&console.warn("trying IE specific stuff");try{window.clipboardData.setData("text",e),s=!0}catch(o){n&&console.error("unable to copy using clipboardData: ",o),n&&console.error("falling back to prompt"),c=function(e){var t=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C";return e.replace(/#{\s*key\s*}/g,t)}("message"in t?t.message:r),window.prompt(c,e)}}finally{u&&("function"==typeof u.removeRange?u.removeRange(i):u.removeAllRanges()),l&&document.body.removeChild(l),a()}return s}},{"toggle-selection":2}],2:[function(e,t,n){t.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],o=0;o<e.rangeCount;o++)n.push(e.getRangeAt(o));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},{}]},{},[1])(1)});`
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
        appendToast();
        init();
        console.log('插件初始化完成。');
        console.groupEnd();
    }, 500);

})({
    buttonText: '复制',
    buttonColor: '#49cc90'
});