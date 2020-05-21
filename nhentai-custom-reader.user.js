// ==UserScript==
// @name         Nhentai Custom Reader
// @version      0.89
// @author       Full Metal Onii-chan
// @homepageURL  https://github.com/FullMetalOnii-chan/nhentai-custom-reader
// @include      /^https:\/\/nhentai\.net\/g\/\d+\/\d+\/$/
// @run-at       document-body
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    ////////////////######===~~~---USER CONFIG---~~~===######\\\\\\\\\\\\\\\\

    let readerSettings = {

        theme: '', // override color theme; matching default site themes - 'black', 'blue' and 'light'; if not set ('') - using account setting;
        hideCursor: true, // true or false, hide cursor when mouseover image;
        defaultFit: '', // 'height' or 'width', set reader image scaling; if not set ('') - using default 'height';
        preloadBack: true, // When opening reader, also load previous pages;
        mouseNavigation: true, // Use 4th/5th mouse buttons to switch pages;
        autoscrollEnabled: true, // true or false, allows mouse autoscroll;
        topHeight: 30, // top scroll area height (in % of visible image height);
        botHeight: 15, // same for bottom;
        overlayOpacity: 0.00, // 0.00 - 1.00, scroll area opacity, change if you wanna see areas/play with height settings, 0.1 shound be enough; default - 0;

        //////////######===~~~---USER CONFIG END---~~~===######\\\\\\\\\\

        get cursor() {
            if (this.hideCursor) {
                return 'none';
            } else {
                return 'default';
            };
        },
        get fit() {
            if (this.defaultFit === 'width') {
                return 'fit-horizontal';
            } else {
                return 'fit-vertical';
            };
        },
        get topH() {
            return this.topHeight/100;
        },
        get botH() {
            return this.botHeight/100;
        },
        get oop() {
            return this.overlayOpacity;
        }
    };

    N.reader.prototype.install_key_handler=function(){
        var t=this,
            e=null,
            n=document.scrollingElement||document.documentElement;
        N.bind(document,"keydown",function(i){
            if(!("input"===i.target.tagName.toLowerCase()||i.metaKey||i.ctrlKey||i.shiftKey||i.altKey)){
                e&&(clearInterval(e),e=null);
                var r=!0,
                    o=t.get_settings(),
                    a=o.scroll_speed;
                switch(i.which){
                    case N.key.S:
                    case N.key.DOWN_ARROW:
                        if (readerIsFullscreen()) {
                            n = t.$image_container;
                        } else {
                            n=document.scrollingElement||document.documentElement;
                        };
                        e=setInterval(function(){
                            n.scrollTop+=a
                        },5);
                        break;
                    case N.key.W:
                    case N.key.UP_ARROW:
                        if (readerIsFullscreen()) {
                            n = t.$image_container;
                        } else {
                            n=document.scrollingElement||document.documentElement;
                        };
                        e=setInterval(function(){
                            n.scrollTop-=a
                        },5);
                        break;
                    case N.key.A:
                    case N.key.LEFT_ARROW:
                        if (t.current_page !== 1) {
                            t.previous_page();
                            readerPageChanged();
                        };
                        break;
                    case N.key.D:
                    case N.key.RIGHT_ARROW:
                        if (t.current_page !== t.num_pages) {
                            t.next_page();
                            readerPageChanged();
                        };
                        break;
                    case N.key.H:
                        document.querySelector('.fitter:not(.active)').click();
                        break;
                    case N.key.F:
                        if (readerIsFullscreen()) {
                            readerExitFullscreen();
                        } else {
                            readerFullscreen();
                        };
                        break;
                    default:
                        r=!1
                }
                r&&i.preventDefault()
            }
        }),
            N.bind(document,"keyup visibilitychange",function(){
            e&&(clearInterval(e),e=null)
        })
    };

    let rs = readerSettings;
    let j, k;
    let imgCont;
    let html = document.documentElement;
    let head = document.head;
    let body = document.body;
    let readerStyled = [
        '--fit-ver-max-height: 100%;',
        '--overlay-max-width: 100%;',
        '--overlay-max-height: 100%; --scroll-top-max-height: ' + rs.topHeight + '%; --scroll-bot-max-height: ' + rs.botHeight + '%;'
    ];
    let readerStyle = [
        '::-webkit-scrollbar {width: 0 !important;}',
        ':-webkit-full-screen {background: #ecf0f1;}',
        ':-moz-full-screen {background: #ecf0f1;}',
        ':-ms-fullscreen {background: #ecf0f1;}',
        ':fullscreen {background: #ecf0f1;}',
        '.theme-blue :-webkit-full-screen {background: #2a3744;}',
        '.theme-blue :-moz-full-screen {background: #2a3744;}',
        '.theme-blue :-ms-fullscreen {background: #2a3744;}',
        '.theme-blue :fullscreen {background: #2a3744;}',
        '.theme-black :-webkit-full-screen {background: #000;}',
        '.theme-black :-moz-full-screen {background: #000;}',
        '.theme-black :-ms-fullscreen {background: #000;}',
        '.theme-black :fullscreen {background: #000;}',
        ':-webkit-full-screen.fit-vertical img {max-height: 100% !important;}',
        ':-moz-full-screen.fit-vertical img {max-height: 100% !important;}',
        ':-ms-fullscreen.fit-vertical img {max-height: 100% !important;}',
        ':fullscreen.fit-vertical img {max-height: 100% !important;}',
        ':-webkit-full-screen {position: fixed; width: 100%; top: 0;}',
        '::placeholder {color: #a9a9a9; opacity: 1;}',
        ':-ms-input-placeholder {color: #a9a9a9;}',
        '::-ms-input-placeholder {color: #a9a9a9;}',
        '.theme-black ::placeholder {color: #757575; opacity: 1;}',
        '.theme-black :-ms-input-placeholder {color: #757575;}',
        '.theme-black ::-ms-input-placeholder {color: #757575;}',
        'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button {-webkit-appearance: none; margin: 0;}',
        'input[type=number] {-moz-appearance: textfield;}',
        '#image-container {overflow: auto; -ms-overflow-style: none;}',
        'nav, .announcement, #messages, .pagination, .back-to-gallery, .advt {display: none;}',
        'body {font-family: "Noto Sans", sans-serif; font-size: 14px; line-height: 20px; height: 100%; margin: 0 !important; color: #fff; background-color: #ecf0f1; text-align: center; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;}',
        '.theme-blue body {color: #9b9b9b; background-color: #2a3744;}',
        '.theme-black body {color: #9b9b9b; background-color: #1f1f1f;}',
        'a {text-decoration: none; color: inherit; outline: none; cursor: default;}',
        '#image-container > a {cursor: ' + rs.cursor + ';}',
        '.hidden {display: none !important; visibility: hidden !important;}',
        'img {height: auto; width: auto; max-width: 100%; vertical-align: middle; border: 0; cursor: ' + rs.cursor + ';}',
        '.fit-horizontal img {height: auto; width: 100%;}',
        '.fit-vertical img {max-height: var(--fit-ver-max-height); width: auto;}',
        '#navbar {z-index: 1; width: 100%;  position: -webkit-sticky; position: sticky; top: 0; background-color: #2a3744;}',
        '.theme-blue #navbar {background-color: #202a34;}',
        '.theme-black #navbar {background-color: #0d0d0d;}',
        '.navbar-inner {min-height: 40px; padding: 0px 20px; background-color: inherit; border-bottom: solid 1px #000}',
        '.theme-blue .navbar-inner {border-bottom-color: #2d455d;}',
        '.theme-black .navbar-inner {border-bottom-color: #252525;}',
        '.collapse {height: 0px;}',
        'ul {list-style-type: none; margin: 0; padding: 0; overflow: hidden; display: inline-block;}',
        '.collapse > ul:last-child {float: right;}',
        'li {float: left;}',
        '.navbar-inner a {display: block; margin: 5px; padding: 5px; font-weight: 300;}',
        '.navbar-inner > a {float: left; font-size: 20px;}',
        'li a:hover:not(.active):not(.disabled):not(.themer) {background-color: #3d5064; color: #9aa7b2;}',
        '.theme-blue li a:hover:not(.active):not(.disabled):not(.themer) {background-color: #3d5064; color: #fff;}',
        '.theme-black li a:hover:not(.active):not(.disabled):not(.themer) {background-color: #383838; color: #fff;}',
        'li a.active, .navbar-inner > a:hover, .themer:hover, .active .icol {color: #9aa7b2;}',
        '.theme-blue li a.active, .theme-blue .navbar-inner > a:hover, .theme-blue .themer:hover {color: #fff;}',
        '.theme-black li a.active, .theme-black .navbar-inner > a:hover, .theme-black .themer:hover {color: #fff;}',
        '.disabled, .disabled > i {color: #34495e !important;}',
        '.theme-black .disabled, .theme-black .disabled > i {color: #333333 !important;}',
        '.pager {width: 70px;}',
        'a.themer {margin: 5px 18.3px;}',
        '.navbar-inner > .navbar-col {display: none;}',
        '.overlay {position: fixed; outline: none; height: 100%; width: 100%; background-color: black; opacity: ' + rs.oop + '; cursor: ' + rs.cursor + ';}',
        '#scTop {max-height: var(--scroll-top-max-height);}',
        '#scBot {max-height: var(--scroll-bot-max-height); bottom: 0%;}',
        '#fOverlay {max-height: var(--overlay-max-height); opacity: 0;}',
        '.fit-vertical .overlay {max-width: var(--overlay-max-width); left: 50%; transform: translateX(-50%);}',
        '.fit-vertical .scroller {display: none;}',
        '.icol {color: #ed2553;}',
        '.theme-blue .icol, .theme-black .icol {color: #fff;}',
        '.dropdown {left: 50%; transform: translateX(-50%); display: none; position: absolute; top: 40px; height: auto; width: 100%; max-width: 450px; max-height: 190px; float: none; overflow-x: hidden; overflow-y: auto; background-color: #2a3744;}',
        '.theme-blue .dropdown {background-color: #202a34;}',
        '.theme-black .dropdown {background-color: #0d0d0d;}',
        '.dropdown.expanded {display: block; padding-bottom: 5px;}',
        '.dropdown > li:first-child {float: none; display: block;}',
        '.dropdown li a {width: 70px; margin: 0px 5px;}',
        '.dropdown a.active {background-color: #3d5064}',
        '.theme-black .dropdown a.active {background-color: #383838}',
        'input {max-width: 100%; max-width: -moz-calc(100% - 10px); max-width: -webkit-calc(100% - 10px); max-width: calc(100% - 10px); width: 100%; text-align: center; display: block; background-color: #3d5064; color: #fff; line-height: 20px; padding: 5px 0px; border: solid 5px #273340;}',
        '.theme-blue input {background-color: #3d5064; border-color: #192531;}',
        '.theme-black input {background-color: #383838; border-color: #000;}',
        '@media screen and (max-width: 800px) { .collapse {display: block; width: 100%; overflow: hidden; transition: height .5s;} .collapse.expanded {height: 260px;} .collapse.expanded.drop-expanded {height: 360px;} .collapse > ul, .collapse > ul:last-child {float: none; display: block;} .dropdown {transition: height .5s; height: 0px; position: static; transform: none; max-width: 100%; max-height: none; display: block;} .dropdown.expanded {height: 100px; padding: 0px;} .dropdown li {display: inline-block;} li {float: none;} .navbar-inner > .navbar-col {display: block; float: right;} .pager {width: auto;} }',
    ];

    function readerUpdatePager() {
        let prev = document.querySelector('.page-prev').classList;
        let next = document.querySelector('.page-next').classList;
        let drop = document.querySelector('.dropdown');
        let cur = window.reader.current_page;
        let last = window.reader.num_pages;
        if (last === 1) {
            prev.add('disabled');
            next.add('disabled');
        } else if (cur === 1) {
            prev.add('disabled');
        } else if (cur === last) {
            next.add('disabled');
        } else {
            prev.remove('disabled');
            next.remove('disabled');
        };
        if (drop) {
            let a = drop.querySelector('.active');
            if (a) {
                a.classList.remove('active');
            };
            drop.querySelector('#page-' + cur).classList.add('active');
        };
        document.querySelector('.pager').innerHTML = cur + ' of ' + last;
    }

    function readerResize() {
        let cHeight = html.clientHeight;
        let imgH;
        if (!(readerIsFullscreen())) {
            cHeight -= 41;
        };
        if (imgCont.classList.contains('fit-vertical')) {
            readerStyled[0] = '--fit-ver-max-height: ' + cHeight + 'px;';
            readerCSSDynamic();
        };
        let imgStyle = window.getComputedStyle(imgCont.querySelector('img'));
        imgH = Number(imgStyle.height.slice(0, -2));
        if (imgH === 0) {
            imgCont.querySelector('img').addEventListener('load', readerResize);
            return;
        };
        if (imgCont.classList.contains('fit-vertical')) {
            let imgW = Math.ceil(Number(imgStyle.width.slice(0, -2)) + 1);
            readerStyled[1] = '--overlay-max-width: '+ imgW + 'px;';
        } else {
            if (rs.autoscrollEnabled && imgH > cHeight) {
                imgH = cHeight;
                imgCont.querySelector('#scTop').classList.remove('hidden');
                imgCont.querySelector('#scBot').classList.remove('hidden');
            } else if (rs.autoscrollEnabled && imgH < cHeight) {
                imgCont.querySelector('#scTop').classList.add('hidden');
                imgCont.querySelector('#scBot').classList.add('hidden');
            } else if (!rs.autoscrollEnabled && imgH > cHeight) {
                imgH = cHeight;
            };
            readerStyled[1] = '--overlay-max-width: 100%;';
        };
        readerStyled[2] = '--overlay-max-height: ' + Math.ceil(imgH) + 'px; --scroll-top-max-height: ' + Math.ceil(imgH * rs.topH) + 'px; --scroll-bot-max-height: ' + Math.ceil(imgH * rs.botH) + 'px;';
        readerCSSDynamic();
        readerTop();
    }

    function readerTop() {
        if (readerIsFullscreen()) {
            imgCont.scrollTop = 0;
        } else {
            body.scrollIntoView();
        };
    }

    function readerPageChanged() {
        readerTop();
        readerUpdatePager();
        readerResize();
    }

    function readerRemove(arg) {
        for (j = 0; j < arguments.length; j++) {
            let t = document.querySelector(arguments[j]);
            if (t && t.parentNode) {
                t.parentNode.removeChild(t);
            };
        };
    }

    function readerCkeckMB(e) {
        let cur = window.reader.current_page;
        let last = window.reader.num_pages;
        if (e.buttons === 16 && rs.mouseNavigation && cur !== last) {
            window.reader.next_page();
        } else if (e.buttons === 8 && rs.mouseNavigation && cur !== 1) {
            window.reader.previous_page();
        } else if (e.buttons === 1) {
            let drop = document.querySelector('.dropdown.expanded');
            if (drop) {
                let c;
                if (e.target.tagName.toLowerCase() === 'li') {
                    c = e.target.parentNode.classList;
                } else {
                    c = e.target.classList;
                };
                if (!(c.contains('pager') || c.contains('drop-item') || c.contains('dropdown'))) {
                    readerPager();
                };
            };
            return;
        } else {
            return;
        };
        readerPageChanged();
    }

    function readerCheckMover(e) {
        if (e.target.id === 'scTop') {
            readerNavigate('UP_ARROW', 38);
        } else if (e.target.id === 'scBot' ) {
            readerNavigate('DOWN_ARROW', 40);
        };
    }

    function readerNavigate(key, code) {
        if(!arguments) {
            let e = new KeyboardEvent('keyup');
            imgCont.dispatchEvent(e);
        } else {
            let e = new KeyboardEvent('keydown', {'key': key, 'keyCode': code, 'which': code});
            imgCont.dispatchEvent(e);
        };
    }

    function readerClean() {
        readerRemove('script[src*="google-analytics"]', 'link[href*="main_style"]', 'meta[name="theme-color"]', 'nav', '.announcement', '#messages', '.advt', '#pagination-page-top', '#pagination-page-bottom', '.back-to-gallery');
        setTimeout(readerRemove, 100, 'body > div:last-child');
    }

    function readerReset() {
        imgCont = window.reader.$image_container;
        document.querySelector('#' + rs.fit).classList.add('active');
        imgCont.className = rs.fit;
        imgCont.querySelector('img').className = '';
        if (rs.theme && rs.theme !== 'none') { html.className = 'theme-' + rs.theme; };
    }

    function readerCSSInject() {

        let readerCSS = document.createElement('link');
        readerCSS.rel = 'stylesheet';
        readerCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css';
        head.appendChild(readerCSS);

        readerCSS = document.createElement('style');
        readerCSS.type = 'text/css';
        readerCSS.id = 'reader-style';
        readerCSS.innerText = readerStyle.join(' ');
        html.appendChild(readerCSS);

        readerCSS = document.createElement('style');
        readerCSS.type = 'text/css';
        readerCSS.id = 'reader-dynamic';
        readerCSS.innerText = ':root {' + readerStyled.join(' ') + '}';
        html.appendChild(readerCSS);
    }

    function readerCSSDynamic() {
        document.querySelector('#reader-dynamic').innerText = ':root {' + readerStyled.join(' ') + '}';
    }

    function readerIsFullscreen() {
        return document.fullScreen || document.fullscreenElement || document.msFullscreenElement || document.mozFullScreen || document.mozFullScreenElement || document.webkitIsFullScreen || document.webkitFullscreenElement;
    }

    function readerFullscreen() {
        let el = imgCont;
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        };
    }

    function readerExitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        };
    }

    function readerFit(e) {
        let t = e.target;
        if(t.tagName.toLowerCase() === 'i') {
            t = e.target.parentNode;
        };
        if (!(t.classList.contains('active') || imgCont.classList.contains(t.id))) {
            let a = document.querySelector('.fitter.active');
            imgCont.classList.add(t.id);
            imgCont.classList.remove(a.id);
            a.classList.remove('active');
            t.classList.add('active');
            readerResize();
        };
    }

    function readerNextPage(e) {
        let c;
        let cur = window.reader.current_page;
        let last = window.reader.num_pages;
        if (e.target.tagName.toLowerCase() === 'i') {
            c = e.target.parentNode.classList;
        } else {
            c = e.target.classList;
        };
        if (cur !== last) {
            if (c.contains('page-next') &&! c.contains('disabled')) {
                window.reader.next_page();
            } else if (c.contains('overlay')) {
                window.reader.next_page();
            } else {
                return;
            };
            readerPageChanged();
        };
    }

    function readerPrevPage(e) {
        let c;
        let cur = window.reader.current_page;
        let last = window.reader.num_pages;
        if (e.target.tagName.toLowerCase() === 'i') {
            c = e.target.parentNode.classList;
        } else {
            c = e.target.classList;
        };
        if (cur !== 1) {
            if (c.contains('page-prev') &&! c.contains('disabled')) {
                window.reader.previous_page();
            } else {
                return;
            };
            readerPageChanged();
        };
    }

    function readerJumpPage(e) {
        let cur = window.reader.current_page;
        let last = window.reader.num_pages;
        let to = Number(e.target.id.match(/\d+/));
        if (to !== cur) {
            if (to === cur + 1) {
                window.reader.next_page();
            } else if (to === cur - 1) {
                window.reader.previous_page();
            } else {
                window.reader.set_page(to, window.reader);
            };
            readerPageChanged();
        };
    }

    function readerJumpInput(e) {
        let input = document.querySelector('input');
        if (e.key === 'ENTER' || e.keyCode === 13 || e.which === 13) {
            let to = Number(input.value);
            if (!isNaN(to) && (input.min <= to <= input.max)) {
                input.value = '';
                let target = document.querySelector('#page-' + to);
                if (target) {
                    target.click();
                };
            };
        } else if (e.key === 'ESCAPE' || e.keyCode === 27 || e.which === 27) {
            input.value = '';
            readerJumpFilter();
        };
    }

    function readerJumpFilter() {
        let filter = document.querySelector('input').value;
        let a = document.querySelector('.dropdown').querySelectorAll('a');
        for (j = 0; j < a.length; j++) {
            if (a[j].innerText.indexOf(filter) > -1) {
                a[j].classList.remove('hidden');
            } else {
                a[j].classList.add('hidden');
            }
        }
    }

    function readerToGallery() {
        location.href = window.reader.gallery_url;
    }

    function readerChangeTheme() {
        if (html.className === 'theme-black') {
            html.className = 'theme-blue';
        } else if (html.className === 'theme-blue') {
            html.className = 'theme-light';
        } else {
            html.className = 'theme-black';
        };
    }

    function readerPager() {
        let drop = document.querySelector('.dropdown');
        if (!drop) {
            document.querySelector('.pager').parentNode.appendChild(readerNavbarCreateDropdown());
            readerUpdatePager();
            document.querySelector('.pager').classList.add('active');
            document.querySelector('.collapse').classList.add('drop-expanded');
        } else if (drop.classList.contains('expanded')) {
            drop.classList.remove('expanded');
            drop.querySelector('input').value = '';
            document.querySelector('.collapse').classList.remove('drop-expanded');
            document.querySelector('.pager').classList.remove('active');
            readerJumpFilter();
        } else {
            drop.classList.add('expanded');
            document.querySelector('.collapse').classList.add('drop-expanded');
            document.querySelector('.pager').classList.add('active');
        };
    }

    function readerPreloadBack() {
        let sp = window.reader.start_page;
        let lp = window.reader.num_pages;
        let c = window.reader.image_cache;
        if (sp !== 1 && (sp + 3 <= lp && c[sp + 3] && c[sp + 3].loaded || sp + 2 === lp && c[lp] && c[lp].loaded || sp + 1 === lp && c[lp] && c[lp].loaded || sp === lp && c[lp] && c[lp].loaded)) {
            window.reader.direction = -1;
            window.reader.maybe_preload();
            window.reader.direction = 0;
        } else {
            setTimeout(readerPreloadBack, 300);
        };
    }

    function readerNavbarCreateDropdown() {
        let cur = window.reader.current_page;
        let last = window.reader.num_pages;
        let drop = document.createElement('ul');
        let input = document.createElement('input');
        let li = document.createElement('li');

        input.min = 1;
        input.max = last;
        input.step = 1;
        input.type = 'number';
        input.placeholder = 'jump to page ...';
        input.className = 'drop-item';
        input.addEventListener('keydown', readerJumpInput);
        input.addEventListener('keyup', readerJumpFilter);

        li.appendChild(input);
        drop.appendChild(li);
        for (j = 1; j <= last; j++) {
            drop.appendChild(readerNavbarCreateItem({id: 'page-' + j, class: 'drop-item', inner: j, handler: readerJumpPage, list: true}));
        };
        drop.classList.add('dropdown', 'expanded');
        return drop;
    }

    function readerNavbarCreateItem(item) {
        let a = document.createElement('a');
        if (item.id) { a.id = item.id; };
        if (item.class) { a.className = item.class; };
        if (item.inner) { a.innerHTML = item.inner; };
        if (item.handler) { a.addEventListener('click', item.handler); };
        if (item.list) {
            let li = document.createElement('li');
            li.appendChild(a);
            return li;
        } else {
            return a;
        };
    }

    function readerNavbar() {

        let readerBar = document.createElement('div');
        let readerBarInner = document.createElement('div');
        let readerBarCollapse = document.createElement('div');
        let readerBarMenu = document.createElement('ul');
        let readerBarMenuR = document.createElement('ul');
        let readerBarItems = [
            {class: 'back-to-g', inner: '<i class="fa fa-eject fa-rotate-270"></i> Gallery', handler: readerToGallery},
            {id: 'fit-vertical', class: 'fitter', inner: 'Fit to Height <i class="fa fa-arrows-v icol"></i>', handler: readerFit, list: true},
            {id: 'fit-horizontal', class: 'fitter', inner: 'Fit to Width <i class="fa fa-arrows-h icol"></i>', handler: readerFit, list: true},
            {class: 'pager', inner: ' of ', handler: readerPager, list: true},
            {class: 'page-prev', inner: '<i class="fa fa-chevron-left icol"></i> Prev', handler: readerPrevPage, list: true},
            {class: 'page-next', inner: 'Next <i class="fa fa-chevron-right icol"></i>', handler: readerNextPage, list: true},
            {inner: '<i class="fa fa-arrows-alt icol"></i> Fullscreen', handler: readerFullscreen, list: true},
            {class: 'themer', inner: '<i class="fa fa-refresh"></i> Theme', handler: readerChangeTheme, list: true},
            {class: 'navbar-col', inner: '<i class="fa fa-bars icol"></i>', handler: function() { document.querySelector('.collapse').classList.toggle('expanded'); }}
        ];

        readerBar.id = 'navbar';
        readerBarInner.className = 'navbar-inner';
        readerBarCollapse.className = 'collapse';

        for (j = 0; j < readerBarItems.length; j++) {
            let el = readerNavbarCreateItem(readerBarItems[j]);
            switch(j) {
                case 0:
                case readerBarItems.length - 1:
                    readerBarInner.appendChild(el);
                    break;
                case readerBarItems.length - 2:
                    readerBarCollapse.appendChild(readerBarMenu);
                    readerBarMenuR.appendChild(el);
                    readerBarCollapse.appendChild(readerBarMenuR);
                    break;
                default:
                    readerBarMenu.appendChild(el);
                    break;
            };
        };

        readerBarInner.appendChild(readerBarCollapse);
        readerBar.appendChild(readerBarInner);
        body.insertBefore(readerBar, body.firstChild);
    }

    function readerAutoscroll() {

        let readerScrTop = document.createElement('div');
        let readerScrBot = document.createElement('div');

        readerScrTop.id = 'scTop';
        readerScrBot.id = 'scBot';
        readerScrTop.classList.add('overlay', 'scroller');
        readerScrBot.classList.add('overlay', 'scroller');

        readerScrTop.addEventListener('mouseover', readerCheckMover);
        readerScrTop.addEventListener('mouseout', readerNavigate);
        readerScrTop.addEventListener('click', readerNextPage);
        readerScrBot.addEventListener('mouseover', readerCheckMover);
        readerScrBot.addEventListener('mouseout', readerNavigate);
        readerScrBot.addEventListener('click', readerNextPage);

        imgCont.insertBefore(readerScrBot, imgCont.firstChild);
        imgCont.insertBefore(readerScrTop, imgCont.firstChild);
    }

    function readerOver() {
        let readerOverlay = document.createElement('div');
        readerOverlay.id = 'fOverlay';
        readerOverlay.classList.add('overlay', 'full-cover');
        readerOverlay.addEventListener('click', readerNextPage);
        imgCont.insertBefore(readerOverlay, imgCont.firstChild);
    }

    function readerInit() {
        window.removeEventListener('DOMContentLoaded', readerInit);
        readerClean();
        readerNavbar();
        readerReset();
        readerCSSInject();
        readerUpdatePager();
        if (rs.autoscrollEnabled) { readerAutoscroll(); };
        readerOver();
        readerResize();
        if (rs.preloadBack) { readerPreloadBack(); };
        window.addEventListener('mousedown', readerCkeckMB);
        window.addEventListener('resize', readerResize);
    }

    window.addEventListener('DOMContentLoaded', readerInit);

})();