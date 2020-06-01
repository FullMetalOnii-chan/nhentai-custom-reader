// ==UserScript==
// @name         Nhentai Custom Reader
// @version      0.90.2
// @author       Full Metal Onii-chan
// @homepageURL  https://github.com/FullMetalOnii-chan/nhentai-custom-reader#readme
// @updateURL    https://github.com/FullMetalOnii-chan/nhentai-custom-reader/raw/master/nhentai-custom-reader.user.js
// @supportURL   https://github.com/FullMetalOnii-chan/nhentai-custom-reader/issues
// @include      /^https:\/\/nhentai\.net\/g\/\d+\/\d+\/$/
// @run-at       document-body
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    N.reader = function(t) {
        N.extend(this, t), this.prepare(), this.num_pages = this.gallery.images.pages.length, this.gallery_url = N.format("/g/{0}/", this.gallery.id), this.current_page = null, this.$image_container = document.querySelector("#image-container"),
            this.install_navbar(), this.injectCSS(), this.apply_settings(), this.install_key_handler(), this.install_navbar_handler(), this.install_image_navigation(), this.settings.enableAutoscroll && this.install_autoscroll(),
            this.image_cache = {}, this.preload_queue = [], this.direction = 0, this.get_image(this.start_page, document.querySelector("#image-container img")), this.install_window_events()
    };

    ////////////////######===~~~---USER CONFIG---~~~===######\\\\\\\\\\\\\\\\

    N.reader.prototype.settings = {

        colorTheme: '', // override color theme; matching default site themes - 'black', 'blue' and 'light'; if not set ('') - using account setting;
        hideCursor: true, // true or false, hide cursor when mouseover image;
        defaultFit: '', // 'height', 'width', 'none', set reader image scaling; if not set ('') - using default 'none';
        turningDirection: 'right', // 'right' or 'left', click on set side of image will load next page; if not set ('') - any image click will load next page;
        preloadPages: 3, // 0 to 5, preload pages forward when reading;
        preloadBack: true, // true or false, preload pages back;
        mouseNavigation: true, // true or false, Use 4th/5th mouse buttons to switch pages;
        enableAutoscroll: true, // true or false, allow mouse autoscroll;
        scrollSpeed: 1000, // 200 to 4000, px/sec, affects keyboard scroll/autoscroll speed; default: 1000;
        topHeight: 30, // top scroll area height (in % of visible image height);
        botHeight: 15, // same for bottom;
        overlayOpacity: 0.00, // 0.00 - 1.00, scroll area opacity, change if you wanna see areas/play with height settings, 0.1 shound be enough; default: 0;

        //////////######===~~~---USER CONFIG END---~~~===######\\\\\\\\\\

        get theme() {
            return this.colorTheme ? 'theme-' + this.colorTheme : html.className.trim();
        },
        set theme(t) {
            this.colorTheme = t.slice(t.indexOf('-') + 1);
        },
        get cursor() {
            return this.hideCursor ? 'none' : 'default';
        },
        get image_scaling() {
            return this.defaultFit === 'width' ? 'fit-horizontal' : this.defaultFit === 'height' ? 'fit-vertical' : 'fit-none';
        },
        set image_scaling(t) {
            'fit-horizontal' === t ? this.defaultFit = 'width' : 'fit-vertical' === t ? this.defaultFit = 'height' : this.defaultFit = '';
        },
        get topH() {
            return Math.max(Math.min(this.topHeight, 100), 0)/100;
        },
        get botH() {
            return Math.max(Math.min(this.botHeight, 100), 0)/100;
        },
        get oop() {
            return Math.max(Math.min(this.overlayOpacity, 1), 0);
        },
        get preload() {
            return Math.max(Math.min(this.preloadPages, 5), 0);
        },
        get scroll_speed() {
            return Math.round(Math.max(Math.min(this.scrollSpeed, 4000), 200) / 200);
        },
        get turning_behavior() {
            return this.turningDirection ? this.turningDirection : 'both';
        }
    };
    N.reader.prototype.prepare = function() {
        var t = document.querySelector('#image-container img'),
            e = document.querySelector('#image-container a'),
            n = document.querySelector('#image-container'),
            i = document.querySelector('#content');
        n.replaceChild(t, e), body.replaceChild(n, i);
        this.remove('script[src*="google-analytics"]', 'link[href*="main_style"]', 'meta[name="theme-color"]', 'nav', '.announcement', '#messages', '.advt', '#pagination-page-top', '#pagination-page-bottom', '.back-to-gallery');
    };
    N.reader.prototype.remove = function(t) {
        for (var e = 0; e < arguments.length; e++ ) {
            var n = document.querySelectorAll(arguments[e]);
            if (n) for (var i = 0; i < n.length; i++) if (n[i].parentNode) n[i].parentNode.removeChild(n[i]);
        };
    };
    N.reader.prototype.clean = function() {
        var t = this;
        setTimeout(function() {
            t.remove('body > div:last-child');
        }, 100), N.install_analytics = function() {}, delete window.ga, delete window.GoogleAnalyticsObject;
    };
    N.reader.prototype.create_pagination_dropdown = function() {
        var t = document.createElement('ul'),
            e = document.createElement('li'),
            n = document.createElement('input');
        t.classList.add('dropdown'), n.min = 1, n.max = this.num_pages, n.step = 1, n.type = 'number', n.placeholder = 'jump to page ...', n.className = 'drop-item', e.appendChild(n), t.appendChild(e);
        for (var i = 1; i <= this.num_pages; i++) t.appendChild(this.create_navbar_item({id: 'page-' + i, class: 'drop-item', inner: i, list: true}));
        return t;
    };
    N.reader.prototype.create_navbar_item = function(t) {
        var e = document.createElement('a');
        if (t.id) e.id = t.id;
        if (t.class) e.className = t.class;
        if (t.inner) e.innerHTML = t.inner;
        if (t.list) {
            var n = document.createElement('li');
            n.appendChild(e);
            return n;
        } else {
            return e;
        };
    };
    N.reader.prototype.install_navbar = function() {
        var t = this,
            e = document.createElement('div'),
            n = document.createElement('div'),
            i = document.createElement('div'),
            r = document.createElement('ul'),
            o = document.createElement('ul'),
            a = [
                {class: 'back-to-g', inner: '<i class="fa fa-eject fa-rotate-270"></i> Gallery'},
                {id: 'fit-horizontal', class: 'fitter', inner: 'Fit width <i class="fa fa-arrows-h icol"></i>', list: true},
                {id: 'fit-vertical', class: 'fitter', inner: 'Fit height <i class="fa fa-arrows-v icol"></i>', list: true},
                {id: 'fit-none', class: 'fitter', inner: 'Fit none <i class="fa fa-ban icol"></i>', list: true},
                {class: 'pagination', inner: t.start_page + ' of ' + t.num_pages, list: true},
                {class: 'page-prev', inner: '<i class="fa fa-chevron-left icol"></i> Prev', list: true},
                {class: 'page-next', inner: 'Next <i class="fa fa-chevron-right icol"></i>', list: true},
                {id: 'fullscreen', inner: '<i class="fa fa-arrows-alt icol"></i> Fullscreen', list: true},
                {class: 'themer', inner: '<i class="fa fa-refresh"></i> Theme', list: true},
                {class: 'navbar-col', inner: '<i class="fa fa-bars icol"></i>'}
            ];
        e.id = 'navbar', n.className = 'navbar-inner', i.className = 'collapse';
        for (var s = 0; s < a.length; s++) {
            var u = t.create_navbar_item(a[s]);
            switch(s) {
                case 0:
                case a.length - 1:
                    n.appendChild(u);
                    break;
                case a.length - 2:
                    i.appendChild(r);
                    o.appendChild(u);
                    i.appendChild(o);
                    break;
                default:
                    r.appendChild(u);
                    break;
            };
        };
        i.querySelector('.pagination').parentNode.appendChild(t.create_pagination_dropdown());
        n.appendChild(i), e.appendChild(n), body.replaceChild(e, body.firstChild);
    };
    N.reader.prototype.update_direction = function(t, e) {
        t + 1 === e ? this.direction = Math.min(3, this.direction + 1) : t - 1 === e ? this.direction = Math.max(-3, this.direction - 1) : this.direction = 0, console.log("Direction is now", this.direction)
    };
    N.reader.prototype.maybe_preload = function() {
        var t = this.get_settings().preload,
            e = [];
        if (this.direction >= 0) var n = Math.min(this.current_page + 1, this.num_pages),
            i = Math.min(this.num_pages, this.current_page + t) + 1,
            r = 1;
        else var n = Math.max(1, this.current_page - 1),
            i = Math.max(1, this.current_page - t) - 1,
            r = -1;
        var e = N.range(n, i, r);
        this.preload_pages(e);
    };
    N.reader.prototype.preload_pages = function(t) {
        if (t.length) {
            var e = this;
            this.preload_timer && (clearTimeout(this.preload_timer), this.preload_timer = null), this.preload_timer = setTimeout(function() {
                do {
                    var n = t[0];
                    t.shift()
                } while (t.length && n in e.image_cache);
                console.log("Preloading page", n);
                var i = e.get_image(n);
                N.bind(i.image, "load", function() {
                    e.preload_pages(t)
                })
            }, 100)
        } else if (this.settings.preloadBack && this.direction === 0 &&! (this.isCached())) {
            this.direction--;
            this.maybe_preload();
        };
    };
    N.reader.prototype.isCached = function() {
        var t = this.current_page,
            e = this.image_cache,
            n = Math.min(this.settings.preloadPages, t - 1);
        for (var i = 1; i <= n; i++) {
            if (!(e[t - i] && e[t - i].loaded)) {
                return false;
            };
        };
        return true;
    };
    N.reader.prototype.apply_settings = function() {
        var t = this.get_settings();
        if (html.className !== t.theme) html.className = t.theme;
        if (this.$image_container.className !== t.image_scaling) this.$image_container.className = t.image_scaling, document.querySelector('#' + t.image_scaling).classList.add('active'), this.resize();
    };
    N.reader.prototype.get_settings = function() {
        var t = this.settings;
        return {
            theme: t.theme,
            preload: t.preload,
            turning_behavior: t.turning_behavior,
            image_scaling: t.image_scaling,
            scroll_speed: t.scroll_speed
        };
    };
    N.reader.prototype.set_settings = function(t) {
        var e = this.settings;
        if (e.theme !== t.theme) e.theme = t.theme;
        if (e.image_scaling !== t.image_scaling) e.image_scaling = t.image_scaling;
    };
    N.reader.prototype.get_page_url = function(t) {
        return N.format("/g/{0}/{1}/", this.gallery.id, t)
    };
    N.reader.prototype.get_extension = function(t) {
        return {
            j: "jpg",
            p: "png",
            g: "gif"
        } [this.gallery.images.pages[t - 1].t]
    };
    N.reader.prototype.get_image_url = function(t) {
        return N.format("{0}galleries/{1}/{2}.{3}", this.media_url, this.gallery.media_id, t, this.get_extension(t))
    };
    N.reader.prototype.get_thumbnail_url = function(t) {
        return N.format("{0}galleries/{1}/{2}t.{3}", this.media_url, this.gallery.media_id, t, this.get_extension(t))
    };
    N.reader.prototype.get_image = function(t, e) {
        if (!(t in this.image_cache)) {
            e || (e = new Image, e.src = this.get_image_url(t)), this.image_cache[t] = {
                image: e,
                loaded: !1
            }, e.width = this.gallery.images.pages[t - 1].w, e.height = this.gallery.images.pages[t - 1].h, e.removeAttribute("class");
            var n = this,
                i = function() {
                    n.image_cache[t].loaded = !0, n.current_page === t && n.maybe_preload()
                };
            "decode" in e ? e.decode().then(i) : N.bind(e, "load", i)
        }
        return this.image_cache[t]
    };
    N.reader.prototype.set_page = function(t, e) {
        if (t !== this.current_page) {
            this.update_direction(this.current_page, t), console.debug("Switching to page", t), this.current_page = t, this.update_pagination(t);
            var n = document.querySelector("#image-container img"),
                i = this.get_image(t);
            n !== i.image && (n.parentNode.appendChild(i.image), n.parentNode.removeChild(n)), i.loaded && this.maybe_preload(), e && history.replaceState && history.replaceState({
                page: t
            }, document.title, this.get_page_url(t)), this.$image_container.scrollTop = 0, body.scrollIntoView(), this.resize();
        };
    };
    N.reader.prototype.previous_page = function() {
        this.set_page(Math.max(1, this.current_page - 1), !0)
    };
    N.reader.prototype.next_page = function() {
        this.set_page(Math.min(this.current_page + 1, this.num_pages), !0)
    };
    N.reader.prototype.update_pagination = function(t) {
        document.title = document.title.replace(/Page (\d+) /, N.format("Page {0} ", t));
        var e = this.num_pages,
            n = document.querySelector('.page-prev').classList,
            i = document.querySelector('.page-next').classList,
            r = document.querySelector('a.drop-item.active');
        if (e === 1) n.add('disabled'), i.add('disabled');
        else if (t === 1) n.add('disabled');
        else if (t === e) i.add('disabled');
        else n.remove('disabled'), i.remove('disabled');
        r && r.classList.remove('active'), document.querySelector('#page-' + t).classList.add('active'), document.querySelector('.pagination').innerHTML = t + ' of ' + e;
    };
    N.reader.prototype.install_key_handler = function() {
        var t = this,
            e = null,
            n = t.$image_container;
        N.bind(document, "keydown", function(i) {
            if (!("input" === i.target.tagName.toLowerCase() || i.metaKey || i.ctrlKey || i.shiftKey || i.altKey)) {
                e && (clearInterval(e), e = null);
                var r = !0,
                    o = t.get_settings(),
                    a = o.scroll_speed;
                switch(i.which) {
                    case N.key.S:
                    case N.key.DOWN_ARROW:
                        e = setInterval(function() {
                            n.scrollTop += a;
                        },5);
                        break;
                    case N.key.W:
                    case N.key.UP_ARROW:
                        e = setInterval(function() {
                            n.scrollTop -= a;
                        },5);
                        break;
                    case N.key.A:
                    case N.key.LEFT_ARROW:
                        t.previous_page();
                        break;
                    case N.key.D:
                    case N.key.RIGHT_ARROW:
                        t.next_page();
                        break;
                    case N.key.H:
                        var s = ['fit-horizontal','fit-vertical','fit-none'];
                        document.querySelector('.fitter.active').classList.remove('active'), o.image_scaling = s[(s.indexOf(o.image_scaling) + 1) % s.length], t.set_settings(o), t.apply_settings();
                        break;
                    case N.key.F:
                        t.isFullscreen() ? t.exitFullscreen() : t.fullscreen();
                        break;
                    case N.key.T:
                        document.querySelector('.themer').click();
                        break;
                    case N.key.O:
                        console.log(o);
                        break;
                    default:
                        r = !1
                }
                r && i.preventDefault()
            }
        }), N.bind(document, "keyup visibilitychange", function() {
            e && (clearInterval(e), e = null)
        });
    };
    N.reader.prototype.install_image_navigation = function() {
        var t = this,
            e = new N.debouncer(300);
        N.bind("#image-container", "img, .overlay", "click", function(n) {
            if (n.preventDefault(), e.is_ready()) {
                e.hit();
                var i = t.get_settings().turning_behavior,
                    r = n.pageX - (this.getBoundingClientRect().left - body.getBoundingClientRect().left),
                    o = r / this.getBoundingClientRect().width;
                "both" === i || "left" === i && .5 > o || "right" === i && o > .5 ? t.next_page() : t.previous_page()
            }
        })
    };
    N.reader.prototype.install_navbar_handler = function() {
        var t = this;
        N.bind('.fitter', 'click', function(e) {
            var n = t.get_settings(),
                i = e.target.tagName.toLowerCase() === 'i' ? e.target.parentNode : e.target;
            if (n.image_scaling !== i.id) document.querySelector('.fitter.active').classList.remove('active'), n.image_scaling = i.id, t.set_settings(n), t.apply_settings();
        }), N.bind('.page-prev', 'click', function() {
            t.previous_page();
        }), N.bind('.page-next', 'click', function() {
            t.next_page();
        }), N.bind('.back-to-g', 'click', function() {
            window.location.href = t.gallery_url;
        }), N.bind('#page-layout', 'click', function() {
            console.log('niy');
        }), N.bind('#fullscreen', 'click', function() {
            t.isFullscreen() ? t.exitFullscreen() : t.fullscreen();
        }), N.bind('.themer', 'click', function() {
            var e = t.get_settings(),
                n = ['theme-black','theme-blue','theme-light'];
            e.theme = n[(n.indexOf(e.theme) + 1) % n.length], t.set_settings(e), t.apply_settings();
        }), N.bind('.navbar-col', 'click', function() {
            document.querySelector('.collapse').classList.toggle('expanded');
        }), N.bind('.pagination', 'click', function() {
            var e = document.querySelector('ul.dropdown'),
                n = document.querySelector('.collapse'),
                i = document.querySelector('.pagination'),
                r = e.querySelector('input');
            if (e.classList.contains('expanded')) e.classList.remove('expanded'), r.value = '', n.classList.remove('drop-expanded'), i.classList.remove('active'), r.dispatchEvent(new KeyboardEvent('keyup'));
            else e.classList.add('expanded'), n.classList.add('drop-expanded'), i.classList.add('active');
        }), N.bind('.dropdown input', 'keydown', function(e) {
            var n = document.querySelector('.dropdown input');
            if (e.key.toLowerCase() === 'enter' || e.keyCode === 13 || e.which === 13) {
                var i = Number(n.value);
                n.value = '';
                if (Number.isInteger(i) && i >= 1 && i <= t.num_pages) t.set_page(i, !0);
            } else if (e.key.toLowerCase() === 'escape' || e.keyCode === 27 || e.which === 27) {
                n.value = '';
            };
        }), N.bind('.dropdown input', 'keyup', function() {
            var e = document.querySelector('.dropdown input').value,
                n = document.querySelectorAll('a.drop-item');
            for (var i = 0; i < n.length; i++) !e || n[i].innerText.indexOf(e) > -1 ? n[i].classList.remove('hidden') : n[i].classList.add('hidden');
        }), N.bind('.dropdown', 'a', 'click', function(e) {
            var n = Number(e.target.id.match(/\d+/));
            t.set_page(n, !0);
        })
    };
    N.reader.prototype.isFullscreen = function () {
        return document.fullScreen || document.fullscreenElement || document.msFullscreenElement || document.mozFullScreen || document.mozFullScreenElement || document.webkitIsFullScreen || document.webkitFullscreenElement;
    };
    N.reader.prototype.fullscreen = function() {
        var t = this.$image_container;
        if (t.requestFullscreen) {
            t.requestFullscreen();
        } else if (t.msRequestFullscreen) {
            t.msRequestFullscreen();
        } else if (t.mozRequestFullScreen) {
            t.mozRequestFullScreen();
        } else if (t.webkitRequestFullscreen) {
            t.webkitRequestFullscreen();
        };
    };
    N.reader.prototype.exitFullscreen = function() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        };
    };
    N.reader.prototype.resize = function() {
        var t = this,
            e = t.get_settings(),
            n = t.$image_container;
        if (t.settings.enableAutoscroll && e.image_scaling !== 'fit-vertical') {
            var i = t.isFullscreen() ? html.clientHeight : html.clientHeight - 41,
                r = [],
                o = window.getComputedStyle(n.querySelector('img')),
                a = Number(o.height.slice(0, -2));
            if (a === 0) {
                N.bind('#image-container img', 'load', function() {
                    t.resize();
                });
                return;
            };
            if (e.image_scaling === 'fit-horizontal') {
                var s = n.querySelector('#scTop'),
                    u = n.querySelector('#scBot');
                a > i ? (a = i, s.classList.remove('hidden'), u.classList.remove('hidden')) : (s.classList.add('hidden'), u.classList.add('hidden'));
                r[0] = ':root { --overlay-max-width: 100%;';
            } else {
                var s = Math.ceil(Number(o.width.slice(0, -2)) + 1);
                r[0] = ':root { --overlay-max-width: '+ s + 'px;';
                a = i;
            };
            r[1] = '--top-max-height: ' + Math.ceil(a * t.settings.topH) + 'px; --bot-max-height: ' + Math.ceil(a * t.settings.botH) + 'px; }';
            document.querySelector('#reader-dynamic').innerText = r.join(' ');
        };
    };
    N.reader.prototype.install_autoscroll = function() {
        var t = this,
            e = null,
            n = t.$image_container,
            i = t.get_settings().scroll_speed,
            r = document.createElement('div');
        r.id = 'scBot', r.classList.add('overlay', 'scroller'), N.bind(r, 'mouseover', function() {
            e && (clearInterval(e), e = null);
            e = setInterval(function(){
                n.scrollTop += i;
            },5);
        }), N.bind(r, 'mouseout', function(){
            e && (clearInterval(e), e = null)
        }), n.insertBefore(r, n.firstChild);

        r = document.createElement('div');
        r.id = 'scTop', r.classList.add('overlay', 'scroller'), N.bind(r, 'mouseover', function() {
            e && (clearInterval(e), e = null);
            e = setInterval(function(){
                n.scrollTop -= i;
            },5);
        }), N.bind(r, 'mouseout', function(){
            e && (clearInterval(e), e = null)
        }), n.insertBefore(r, n.firstChild);
    };
    N.reader.prototype.install_window_events = function() {
        var t = this;
        t.clean();
        N.bind(window, 'resize', function() {
            t.resize();
        }), N.bind(window, 'mousedown', function(e) {
            if (e.buttons === 16 && t.settings.mouseNavigation) {
                t.next_page();
            } else if (e.buttons === 8 && t.settings.mouseNavigation) {
                t.previous_page();
            } else if (e.buttons === 1) {
                var n = document.querySelector('.dropdown.expanded'),
                    i = e.target.tagName.toLowerCase() === 'li' ? e.target.parentNode.classList : e.target.classList;
                if (n &&! (i.contains('pagination') || i.contains('drop-item') || i.contains('dropdown'))) {
                    document.querySelector('.pagination').click();
                };
            } else {
                return;
            };
        });
    };
    N.reader.prototype.injectCSS = function() {
        var t = document.createElement('link');
        t.rel = 'stylesheet';
        t.href = 'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css';
        head.appendChild(t);

        t = document.createElement('style');
        t.type = 'text/css';
        t.id = 'reader-style';
        t.innerText = this.style();
        html.appendChild(t);

        t = document.createElement('style');
        t.type = 'text/css';
        t.id = 'reader-dynamic';
        t.innerText = this.styled();
        html.appendChild(t);
    };
    N.reader.prototype.styled = function() {
        return ':root { ' + [
            '--overlay-max-width: 100%;',
            '--top-max-height: ' + this.settings.topHeight + '%; --bot-max-height: ' + this.settings.botHeight + '%;'
        ].join(' ') + ' }';
    };
    N.reader.prototype.style = function() {
        return [
            'nav, .announcement, #messages, .pagination, .back-to-gallery, .advt { display: none; }',
            'html, body { font-family: "Noto Sans", sans-serif; height: 100%; }',
            'body { overflow: hidden; font-size: 14px; line-height: 20px; margin: 0 !important; color: #fff; background-color: #ecf0f1; text-align: center; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }',
            '.theme-blue body { color: #9b9b9b; background-color: #2a3744; }',
            '.theme-black body { color: #9b9b9b; background-color: #1f1f1f; }',
            '.hidden { display: none !important; visibility: hidden !important; }',
            '#image-container { text-align: center; height: 100%; overflow: auto; -ms-overflow-style: none; outline: 0; }',
            '#image-container.fit-horizontal { height: -moz-calc(100% - 41px); height: -webkit-calc(100% - 41px); height: calc(100% - 41px); }',
            '#image-container > * { cursor: ' + this.settings.cursor + '; }',
            'img { height: auto; width: auto; max-width: 100%; vertical-align: middle; border-style: none; }',
            '.fit-horizontal img { height: auto; width: 100%; }',
            '.fit-vertical img { max-height: -moz-calc(100% - 41px); max-height: -webkit-calc(100% - 41px); max-height: calc(100% - 41px); width: auto; }',
            '#navbar { z-index: 1; width: 100%; position: static; top: 0; background-color: #2a3744; }',
            '.theme-blue #navbar { background-color: #202a34; }',
            '.theme-black #navbar { background-color: #0d0d0d; }',
            '.navbar-inner { min-height: 40px; padding: 0px 20px; background-color: inherit; border-bottom: solid 1px #000; }',
            '.theme-blue .navbar-inner { border-bottom-color: #2d455d; }',
            '.theme-black .navbar-inner { border-bottom-color: #252525; }',
            '.collapse { height: 0px; }',
            'ul { list-style-type: none; margin: 0; padding: 0; overflow: hidden; display: inline-block; }',
            '.collapse > ul:last-child { float: right; }',
            'li { float: left; }',
            'a { text-decoration: none; color: inherit; outline: none; cursor: default; }',
            '.navbar-inner a { display: block; margin: 5px; padding: 5px; font-weight: 300; }',
            '.navbar-inner > a { float: left; font-size: 20px; }',
            'li a:hover:not(.active):not(.disabled):not(.themer) { background-color: #3d5064; color: #9aa7b2; }',
            '.theme-blue li a:hover:not(.active):not(.disabled):not(.themer) { background-color: #3d5064; color: #fff; }',
            '.theme-black li a:hover:not(.active):not(.disabled):not(.themer) { background-color: #383838; color: #fff; }',
            'li a.active, .navbar-inner > a:hover, .themer:hover, .active .icol { color: #9aa7b2; }',
            '.theme-blue li a.active, .theme-blue .navbar-inner > a:hover, .theme-blue .themer:hover { color: #fff; }',
            '.theme-black li a.active, .theme-black .navbar-inner > a:hover, .theme-black .themer:hover { color: #fff; }',
            '.disabled, .disabled > i { color: #34495e !important; }',
            '.theme-black .disabled, .theme-black .disabled > i { color: #333333 !important; }',
            '.pagination { width: 70px; }',
            'a.themer { margin: 5px 18.3px; }',
            '.icol { color: #ed2553; }',
            '.theme-blue .icol, .theme-black .icol { color: #fff; }',
            '.navbar-inner > .navbar-col { display: none; }',
            '.dropdown { left: 50%; transform: translateX(-50%); display: none; position: absolute; top: 40px; height: auto; width: 100%; max-width: 450px; max-height: 190px; float: none; overflow-x: hidden; overflow-y: auto; background-color: #2a3744; }',
            '.theme-blue .dropdown { background-color: #202a34; }',
            '.theme-black .dropdown { background-color: #0d0d0d; }',
            '.dropdown.expanded { display: block; z-index: 1; padding-bottom: 5px; }',
            '.dropdown > li:first-child { float: none; display: block; }',
            '.dropdown li a { width: 70px; margin: 0px 5px; }',
            '.dropdown a.active { background-color: #3d5064; }',
            '.theme-black .dropdown a.active { background-color: #383838; }',
            'input { max-width: 100%; max-width: -moz-calc(100% - 10px); max-width: -webkit-calc(100% - 10px); max-width: calc(100% - 10px); width: 100%; text-align: center; display: block; background-color: #3d5064; color: #fff; line-height: 20px; padding: 5px 0px; border: solid 5px #273340; }',
            '.theme-blue input { background-color: #3d5064; border-color: #192531; }',
            '.theme-black input { background-color: #383838; border-color: #000; }',
            '.overlay { position: fixed; left: 50%; transform: translateX(-50%); outline: none; height: 100%; width: 100%; max-width: var(--overlay-max-width); background-color: black; opacity: ' + this.settings.oop + '; }',
            '#scTop { max-height: var(--top-max-height); }',
            '#scBot { max-height: var(--bot-max-height); bottom: 0%; }',
            '.fit-vertical .scroller { display: none; }',
            '@media screen and (max-width: 900px) {',
            '.collapse { display: block; transition: height .5s; width: 100%; overflow: hidden; }',
            '.collapse.expanded { height: 290px; }',
            '.collapse.expanded.drop-expanded { height: 390px; }',
            '.collapse > ul, .collapse > ul:last-child { display: block; float: none; }',
            '.dropdown { display: block; position: static; transform: none; transition: height .5s; height: 0px; max-height: none; max-width: 100%; }',
            '.dropdown.expanded { height: 100px; padding: 0px; }',
            '.dropdown li { display: inline-block; }',
            'li { float: none; }',
            '.navbar-inner > .navbar-col { display: block; float: right; }',
            'a.pagination { width: auto; margin-bottom: 0px; }',
            '}',
            '::-webkit-scrollbar { width: 0 !important; }',
            ':-webkit-full-screen { background: #ecf0f1; }',
            ':-moz-full-screen { background: #ecf0f1; }',
            ':-ms-fullscreen { background: #ecf0f1; }',
            ':fullscreen { background: #ecf0f1; }',
            '.theme-blue :-webkit-full-screen { background: #2a3744; }',
            '.theme-blue :-moz-full-screen { background: #2a3744; }',
            '.theme-blue :-ms-fullscreen { background: #2a3744; }',
            '.theme-blue :fullscreen { background: #2a3744; }',
            '.theme-black :-webkit-full-screen { background: #000; }',
            '.theme-black :-moz-full-screen { background: #000; }',
            '.theme-black :-ms-fullscreen { background: #000; }',
            '.theme-black :fullscreen { background: #000; }',
            ':-webkit-full-screen.fit-vertical img { max-height: 100% !important; }',
            ':-moz-full-screen.fit-vertical img { max-height: 100% !important; }',
            ':-ms-fullscreen.fit-vertical img { max-height: 100% !important; }',
            ':fullscreen.fit-vertical img { max-height: 100% !important; }',
            ':-webkit-full-screen { position: fixed; width: 100%; top: 0; }',
            '::placeholder { color: #a9a9a9; opacity: 1; }',
            ':-ms-input-placeholder { color: #a9a9a9; }',
            '::-ms-input-placeholder { color: #a9a9a9; }',
            '.theme-black ::placeholder { color: #757575; opacity: 1; }',
            '.theme-black :-ms-input-placeholder { color: #757575; }',
            '.theme-black ::-ms-input-placeholder { color: #757575; }',
            'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }',
            'input[type=number] { -moz-appearance: textfield; }',
        ].join(' ');
    };

    N.key = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        ESCAPE: 27,
        SPACEBAR: 32,
        LEFT_ARROW: 37,
        UP_ARROW: 38,
        RIGHT_ARROW: 39,
        DOWN_ARROW: 40,
        A: 65,
        D: 68,
        F: 70,
        H: 72,
        O: 79,
        S: 83,
        T: 84,
        W: 87
    };

    let html = document.documentElement,
        head = document.head,
        body = document.body;

})();
