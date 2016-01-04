/**
 * spa.chat.js
 * Created by 柏帅 on 2015/12/31.
 */

/*
* jslint          browser : true, continue :true,
* devel   : true, indent  : 2,    maxerr   :50,
* newcap  : true, nomen   : true,plusplus  :true,
* regexp  : true,sloppy   : vars           :false,
* white   : true
* */

spa.chat = (function () {
    'use strict'
    //将聊天模块的HTML模板保存在configMap中
    var configMap = {
        main_html : String()
        + '<div class="spa-chat">'
            + '<div class="spa-chat-head">'
                + '<div class="spa-chat-head-toggle">+</div>'
                + '<div class="spa-chat-head-title">'
                    + 'Chat'
                + '</div>'
            + '</div>'
            + '<div class="spa-chat-closer">x</div>'
            + '<div class="spa-chat-sizer">'
                + '<div class="spa-chat-list">'
                    + '<div class="spa-chat-list-box"></div>'
                + '</div>'
                + '<div class="spa-chat-msgs">'
                    + '<div class="spa-chat-msg-log"></div>'
                    + '<div class="spa-chat-msg-in">' +
                        + '<form class="spa-chat-msg-form">'
                            + '<input type="text"/>'
                            + '<input type="submit" style="display: none">'
                            + '<div class="spa-chat-msg-send">'
                                + 'send'
                            + '</div>'
                        + '</form>'
                    + '</div>'
                + '</div>'
                + '<div class="spa-chat-box">'
                    + '<input type="text"/>'
                    + '<div>send</div>'
                + '</div>'
            + '</div>'
        + '</div>',
        settable_map : {
            slider_open_time: true,
            slider_close_time: true,
            slider_opened_em: true,
            slider_closed_em: true,
            slider_opened_title: true,
            slider_closed_title: true,

            chat_model: true,
            people_model: true,
            set_chat_anchor: true
        },

        slider_open_time: 250,
        slider_close_time: 250,
        slider_opened_em: 16,
        slider_closed_em: 2,
        slider_opened_title: 'Tap to close',
        slider_closed_title: 'Tap to open',
        slider_opened_min_em :10,
        window_height_min_em :20,
        chat_model: null,
        peopel_model: null,
        set_chat_anchor: null
    },
    stateMap  = {
       // $container : null
        $append_target: null,
        position_type: 'closed',
        px_per_em: 0,
        slider_hidden_px: 0,
        slider_closed_px: 0,
        slider_opened_px: 0
    },
    jqueryMap = {},
    setJqueryMap, getEmSize, setPxSizes, scrollChat, writeChat, writeAlert, clearChat, setSliderPosition,
    onTapToggle, onSubmitMsg, onTapList,
    onSetchatee, onUpdatechat, onListchange,
    onLogin, onLogout,
    configModule, initModule,removeSlider, handleResize;
    //把em显示单位转化为像素，这样就可以使用jquery的度量方法了
    getEmSize = function (elem) {
        return Number(
            getComputedStyle(elem,'').fontSize.match(/\d*\.?\d*/)[0]
        );
    };
    removeSlider = function () {
        if( jqueryMap.$slider ) {
            jqueryMap.$slider.remove();
            jqueryMap = {};
        }
        stateMap.$append_target = null;
        stateMap.position_type = 'closed';

        configMap.chat_model = null;
        configMap.peopel_model = null;
        configMap.set_chat_anchor = null;

        return true;
    }
    setJqueryMap = function () {
        //var $container = stateMap.$container;
        //jqueryMap = { $container : $container };
        var $append_target = stateMap.$append_target,
            $silder = $append_target.find('.spa-chat');

        jqueryMap = {
            $slider   : $silder,
            $head     : $silder.find('.spa-chat-head'),
            $toggle   : $silder.find('.spa-chat-head-toggle'),
            $title    : $silder.find('.spa-chat-head-title'),
            $sizer    : $silder.find('.spa-chat-sizer'),
            $list_box : $silder.find('.spa-chat-list-box'),
            $msg_log  : $silder.find('.spa-chat-msg-log'),
            $msg_in   : $silder.find('.spa-chat-msg-in'),
            $input    : $silder.find('.spa-chat-msg-in input[type=text]'),
            $send     : $silder.find('.spa-chat-msg-send'),
            $form     : $silder.find('.spa-chat-msg-form'),
            $window   : $(window)
        };
    };

    //计算由模块管理的元素的像素尺寸
    setPxSizes = function () {
        var px_per_em, window_height_em, opened_height_em;
        px_per_em = getEmSize( jqueryMap.$slider.get(0) );
        //计算窗口高度，单位是em
        window_height_em = Math.floor(
            (jqueryMap.$window.height() /px_per_em) + 0.5
        );
        opened_height_em = window_height_em > configMap.window_height_min_em ? configMap.slider_opened_em : configMap.slider_opened_min_em;
       // opened_height_em = configMap.slider_opened_em;
        stateMap.px_per_em = px_per_em;
        stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em;
        stateMap.slider_opened_px = opened_height_em * px_per_em;
        jqueryMap.$sizer.css({
            height : (opened_height_em -2) * px_per_em
        });
    };

    handleResize = function () {
        if ( !jqueryMap.$slider ) {return false;}
        setPxSizes();
        if ( stateMap.position_type === 'opened' ){
            jqueryMap.$slider.css({ height : stateMap.slider_opened_px });
        }
        return true;
    }

    setSliderPosition = function( position_type, callback ) {
        var height_px, animate_time, slider_title, toggle_text;

        if( position_type === 'opened' && configMap.peopel_model.get_user().get_is_anon()) {return false;}
        if( stateMap.position_type === position_type ) {
            if( position_type === 'opened'){
                jqueryMap.$input.focus();
            }
            return true;
        }

        switch ( position_type ) {
            case 'opened' :
                height_px = stateMap.slider_opened_px;
                animate_time = configMap.slider_open_time;
                slider_title = configMap.slider_opened_title;
                toggle_text = '=';
                jqueryMap.$input.focus();
                break;
            case 'hidden' :
                height_px = 0;
                animate_time = configMap.slider_open_time;
                slider_title = '';
                toggle_text = '+';
                break;
            case 'closed' :
                height_px = stateMap.slider_closed_px;
                animate_time = configMap.slider_close_time;
                slider_title = configMap.slider_closed_title;
                toggle_text = '+';
                break;
            default : return false;
        }
        stateMap.position_type = '';
        jqueryMap.$slider.animate(
            {height :height_px},
            animate_time,
            function () {
                jqueryMap.$toggle.prop( 'title', slider_title );
                jqueryMap.$toggle.text( toggle_text );
                stateMap.position_type = position_type;
                if( callback ) { callback(jqueryMap.$slider ); }
            }
        );
        return true;
    };

    scrollChat = function () {
        var $msg_log = jqueryMap.$msg_log;
        $msg_log.animate(
            {
                scrollTop : $msg_log.prop( 'scrollHeight' ) - $msg_log.height()
            },
            150
        );
    };

    writeChat = function ( person_name, text, is_user) {
        var msg_class = is_user ? 'spa-chat-msg-log-me' : 'spa-chat-msg-log-msg';
        jqueryMap.$msg_log.append(
            '<div class="'+ msg_class + '">'
            + spa.util_b.encodeHtml(person_name) + ':'
            + spa.util_b.encodeHtml(text) + '</div>'
        );
        scrollChat();
    };

    writeAlert = function ( alert_text ) {
        jqueryMap.$msg_log.append(
            '<div class = "spa-chat-msg-log-alert">'
            + spa.util_b.encodeHtml(alert_text)
            + '</div>'
        );
        scrollChat();
    };

    clearChat = function () {jqueryMap.$msg_log.empty();};

    onTapToggle = function ( event ) {
        var set_chat_anchor = configMap.set_chat_anchor;
        if( stateMap.position_type === 'opened' ) {
            set_chat_anchor('closed');
        }else if( stateMap.position_type === 'closed' ) {
            set_chat_anchor( 'opened' );
        } return false;
    }

    onSubmitMsg = function (event) {
        var msg_text = jqueryMap.$input.val();
        if ( msg_text.trim() === '' ) { return false; }
        configMap.chat_model.send_msg( msg_text );
        jqueryMap.$input.focus();
        jqueryMap.$send.addClass('spa-x-select');
        setTimeout(function(){
            jqueryMap.$send.removeClass('spa-x-select');
        },250);
        return false;
    }

    onTapList = function (event) {

    }
    //创建configModule方法，每当功能模块设置setting时调用
    configModule = function ( input_map ) {
        spa.util.setConfigMap({
            input_map    : input_map,
            settable_map : configMap.settable_map,
            config_map   : configMap
        });
        return true;
    };
    //添加initModule方法，用于执行模块
    initModule = function ( $append_target ) {
        //$container.html( configMap.main_html );//使用html模板填充聊天滑块容器
        //stateMap.$container = $container;
        //setJqueryMap();
        $append_target.append( configMap.main_html );
        stateMap.$append_target = $append_target;
        setJqueryMap();
        setPxSizes();

        jqueryMap.$toggle.prop( 'title', configMap.slider_closed_title);
        jqueryMap.$head.click( onClickToggle );
        stateMap.position_type = 'closed';
        return true;
    };
    //到处模板方法，这两个方法几乎是所有功能模块的标配方法
    return {
        setSliderPosition : setSliderPosition,
        configModule : configModule,
        initModule   : initModule,
        removeSlider : removeSlider,
        handleResize : handleResize
    };
}());