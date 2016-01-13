/**
 * Created by baishuai on 2016/1/13.
 */

/*
 * jslint          browser : true, continue :true,
 * devel   : true, indent  : 2,    maxerr   :50,
 * newcap  : true, nomen   : true,plusplus  :true,
 * regexp  : true,sloppy   : vars           :false,
 * white   : true
 * */

'use strict';

var emitUserList, signIn,singOut, chatObj,
    socket      = require('socket.io'),
    crud        = require('./crud'),
    makeMongoId = crud.makeMongoId,
    chatterMap  = {};

emitUserList = function ( io ) {
    crud.read(
        'user',
        {is_online: true},
        {},
        function ( result_list ) {
            io.of('/chat').emit('listchange',result_list);
        }
    )
};

singOut = function (io, user_id){
    crud.update(
        'user',
        {'_id' : user_id},
        {is_online : false },
        function ( result_list ) { emitUserList(io)}
    );
    delete chatterMap[ user_id ];
}

signIn = function ( io, user_map, socket ) {
    crud.update(
        'user',
        {'_id' : user_map._id},
        {is_online : true},
        function ( result_map ) {
            emitUserList(io);
            user_map.is_online = true;
            socket.emit('userupdate',user_map)
        }
    );
    chatterMap[ user_map._id ] = socket;
    socket.user_id = user_map._id;
};





chatObj = {
    connect: function (server) {
        var io = socket.listen( server );
        io.set('blacklist',[])
            .of('/chat')
            .on('connection',function (socket) {
                socket.on('adduser', function ( user_map ) {
                    crud.read(
                        'user',
                        {name : user_map.name},
                        {},
                        function ( result_list ){
                            var result_map,
                                cid = user_map.cid;

                            delete  user_map.cid;

                            if( result_list.length > 0 ){
                                result_map = result_list[0];
                                result_map.cid = cid;
                                signIn(io,result_map,socket);
                            }else{
                                user_map.is_online = true;
                                crud.construct(
                                    'user',
                                    user_map,
                                    function ( result_list ) {
                                        result_map   = result_list[0];
                                        result_map.cid = cid;
                                        chatterMap[result_map._id] = socket;
                                        socket.user_id = result_map._id;
                                        socket.emit('userupdate',result_map);
                                        emitUserList(io);
                                    }
                                )
                            }
                        }
                    )
                });
                socket.on('updatechat', function ( chat_map ) {
                    if ( chatterMap.hasOwnProperty( chat_map.dest_id )){
                        chatterMap[chat_map.dest_id].emit('updatechat',chat_map);
                    }else{
                        socket.emit('updatechat',{
                            sender_id  :  chat_map.sender_id,
                            msg_text   :  chat_map.dest_name + 'has gone offline'
                        })
                    }
                });
                socket.on('leavechat', function ( socket ) {
                    console.log('** user %s logged out **',socket.user_id);
                    singOut(io,socket.user_id);
                });
                socket.on('disconnect', function ( ) {
                    console.log('** user %s closed brower window or tab **',socket.user_id);
                });
                socket.on('updateavatar', function (avtr_map ) {
                    crud.update(
                        'user',
                        {'_id' : makeMongoId(avtr_map.person_id)},
                        {css_map : avtr_map.css_map},
                        function ( result_list ) {
                            emitUserList(result_list);
                        }
                    )
                });
            });
        return io;
    }
};

module.exports = chatObj;

