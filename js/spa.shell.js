/*
* spa.shell.js
* shell module for SPA
* */
spa.shell = (function(){
    'use strict';
    var configMap = {
        anchor_schema_map : {
            chat : {opened:true,closed:true}
        },
        main_html : String()
        + '<div class="spa-shell-head">'
          +  '<div class="spa-shell-head-logo">'
            + '<h1>SPA</h1>'
            + '<p>javascript end to end</p>'
          +  '</div>'
          +'<div class="spa-shell-head-acct"></div>'
        + '</div>'
        + '<div class="spa-shell-main spa-x-closed">'
          + '<div class="spa-shell-main-nav"></div>'
          + '<div class="spa-shell-main-content"></div>'
        + '</div>'
        + '<div class="spa-shell-foot"></div>'
        + '<div class="spa-shell-chat"></div>'
        + '<div class="spa-shell-modal"></div>',
        resize_interval     :200,//考虑到尺寸调整事件，在设置中创建一个200毫秒的间隔字段
        chat_extend_time    :1000,
        chat_retract_time   :300,
        chat_extend_height  :450,
        chat_retract_height :15,
        chat_extend_title   :'Click to retract',
        chat_retract_title  :'click to extend'
    },
    stateMap = {
        $container        : undefined,
        anchor_map        :{},
        resize_idto       :undefined
        //is_chat_retracted :true

    },
    jqueryMap = {},
    copyAnchorMap,setJqueryMap,onResize,toggleChat,
    changeAnchorPart,onHashchange,onClickChat,
    onTapAcct, onLogin, onLogout,
    setChatAnchor,initModule;

    onResize = function () {
        if ( stateMap.resize_idto ) { return true; }

        spa.chat.handleResize();
        stateMap.resize_idto = setTimeout(
            function () { stateMap.resize_idto = undefined; },
            configMap.resize_interval
        );

        return true;
    }
    //使用jquery的extengd（）工具方法来复制对象，因为所有的JS对象都是按照引用传递的。
    copyAnchorMap = function () {
        return $.extend(true,{},stateMap.anchor_map)
    }
    changeAnchorPart = function( arg_map ){
        var anchor_map_revise = copyAnchorMap(),
        bool_return = true,
        key_name, key_name_dep;
        KEYVAL:
        for (key_name in arg_map){
            if (arg_map.hasOwnProperty(key_name)){
                if(key_name.indexOf('_') === 0 ){ continue KEYVAL; }
                anchor_map_revise[key_name] = arg_map[key_name];
                key_name_dep = '_' + key_name;
                if(arg_map[key_name_dep]){
                    anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                }else{
                    delete anchor_map_revise[key_name_dep];
                    delete anchor_map_revise['_s'+key_name_dep];
                }
            }
        }
        try {
            $.uriAnchor.setAnchor(anchor_map_revise);
        }catch (error){
            $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
            bool_return = false;
        }
        return bool_return;
    }
    onHashchange = function ( event ) {
        var anchor_map_previous =  copyAnchorMap(),
            is_ok = true,
            anchor_map_proposed,
            _s_chat_previous,_s_chat_proposed,
            s_chat_proposed;
        try{
            anchor_map_proposed = $.uriAnchor.makeAnchorMap();
        }catch (error){
            $.uriAnchor.setAnchor(anchor_map_previous,null,true);
            return false;
        }
        stateMap.anchor_map = anchor_map_proposed;

        _s_chat_previous = anchor_map_previous._s_chat;
        _s_chat_proposed = anchor_map_proposed._s_chat;

        if(!anchor_map_previous || _s_chat_previous !== _s_chat_proposed){
            s_chat_proposed = anchor_map_proposed.chat;
            switch (s_chat_proposed){
                case 'opened' :
                    is_ok = spa.chat.setSliderPosition('opened');
                    break;
                case 'closed' :
                    is_ok = spa.chat.setSliderPosition('closed');
                    break
                default :
                    spa.chat.setSliderPosition('closed');
                    delete  anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor(anchor_map_proposed,null,true);
            }
        }
        if(!is_ok){
            if( anchor_map_previous ){
                $.uriAnchor.setAnchor( anchor_map_previous, null, true);
                stateMap.anchor_map = anchor_map_previous;
            }else{
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor( anchor_map_proposed, null, true);
            }
        }
        return false;
    }
    setJqueryMap = function(){
        var $container = stateMap.$container;
        jqueryMap = {
            $container:$container,
            $acct     :$container.find('.spa-shell-head-acct'),
            $nav      :$container.find('.spa-shell-main-nav')
            //$chat : $container.find('.spa-shell-chat')
        };
    };
    toggleChat = function(do_extend,callback){
      var px_chat_ht = jqueryMap.$chat.height(),
          is_open = px_chat_ht === configMap.chat_extend_height,
          is_closed = px_chat_ht == configMap.chat_retract_height,
          is_sliding = ! is_open && ! is_closed;
      if ( is_sliding ) { return false }
      if( do_extend ){
          jqueryMap.$chat.animate(
              {height:configMap.chat_extend_height},
              configMap.chat_extend_time,
              function(){
                  jqueryMap.$chat.attr(
                      'title',configMap.chat_extend_title
                  );
                  stateMap.is_chat_retracted = false;
                  if (callback){callback(jqueryMap.$chat)}
              }
          );
          return true;
      };
      jqueryMap.$chat.animate(
            {height:configMap.chat_retract_height},
            configMap.chat_extend_time,
            function(){
                jqueryMap.$chat.attr(
                    'title',configMap.chat_retract_time
                );
                stateMap.is_chat_retracted = true;
                if (callback){callback(jqueryMap.$chat)}
            }
      );
      return true;
    };
    onClickChat = function(event){
        changeAnchorPart({
            chat: (stateMap.is_chat_retracted ? 'open' : 'closed')
        });
        return false;
    };
    setChatAnchor = function (position_type) {
        return changeAnchorPart({ chat: position_type });
    };

    onTapAcct = function (event) {
        var acct_text,user_name, user=spa.model.people.get_user();
        if(user.get_is_anon()){
            user_name = prompt('Please sing-in');
            spa.model.people.login( user_name );
            jqueryMap.$acct.text( '...processing...');
        }else{
            spa.model.people.logout();
        }
        return false;
    };

    onLogin = function (event ,login_user) {
        jqueryMap.$acct.text( login_user.name );
    };

    onLogout = function (event ,login_user) {
        jqueryMap.$acct.text( 'Please sing-in');
    };
    initModule = function($container){
        //设置URI锚
        $.uriAnchor.configModule({
            schema_map : configMap.anchor_schema_map
        });
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();
        spa.chat.configModule( {
            set_chat_anchor : setChatAnchor,
            chat_model :spa.model.chat,
            peopel_model :spa.model.peopel
        } );
        spa.chat.initModule( jqueryMap.$container );
        stateMap.is_chat_retracted = true;
        //jqueryMap.$chat.attr('title',configMap.chat_retract_title).click(onClickChat);
        $(window).bind('resize',onResize).bind('hashchange',onHashchange).trigger('hashchange');
        $.gevent.subscribe($container, 'spa-login', onLogin);
        $.gevent.subscribe($container, 'spa-logout', onLogout);

        jqueryMap.$acct.text( 'Please sign-in' ).bind( 'utap', onTapAcct );
    }
    return { initModule:initModule };
}())