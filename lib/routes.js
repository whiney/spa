/**
 * Created by baishuai on 2016/1/6.
 */

/*
 * jslint          browser : true, continue :true,
 * devel   : true, indent  : 2,    maxerr   :50,
 * newcap  : true, nomen   : true,plusplus  :true,
 * regexp  : true,sloppy   : vars           :false,
 * white   : true
 * */

'use strict';

var loadSchema, checkSchema,configRoutes,
    mongodb     = require('mongodb'),
    fsHandle    = require('fs'),
    JSV         = require('JSV').JSV,
    crud        = require('./crud'),
    chat        = require('./chat'),
    mongoServer = new mongodb.Server('localhost',mongodb.Connection.DEFAULT_PORT),
    dbHandle    = new mongodb.Db('spa',mongoServer, {safe : true}),
    validator   = JSV.createEnvironment(),
    makeMongoId = mongodb.ObjectID,
    objTypeMap  = {'user':{}};

loadSchema = function ( schema_name, schema_path ) {
    fsHandle.readFile( schema_path, 'utf8', function ( err, data ) {
        objTypeMap[ schema_name ] = JSON.parse( data );
    });
};

checkSchema = function ( obj_type, obj_map, callback ) {
    var schema_map = objTypeMap[ obj_type],
        report_map = validator.validate( obj_map, schema_map);
    callback( report_map.errors );
}

dbHandle.open( function() {
    console.log( '** Connected to MongoDB **' );
});

(function () {
    var schema_name, schema_path;
    for ( schema_name in objTypeMap ) {
        if (objTypeMap.hasOwnProperty( schema_name )){
            schema_path = __dirname + '/' +schema_name +".json";
            loadSchema(schema_name,schema_path);
        }
    }
})

configRoutes =function( app, server ) {
    app.get('/', function ( request, response ) {
        response.redirect('/spa.html');
    });

    app.all('/:obj_type/*?', function ( request, response, next ) {
        response.contentType( 'json' );
        if ( objTypeMap[request.params.obj_type]){
            next();
        }else{
            response.send({error_msg : request.params.obj_type + 'is not a valid object type'});
        }
    });

    app.get('/:obj_type/list', function ( request, response ) {
        crud.read(
            request.params.obj_type,
            {},{},
            function ( map_list ) { response.send( map_list ) }
        )
    });

    app.post('/:obj_type/create', function ( request, response ) {
        crud.construct(
            request.params.obj_type,
            request.body,
            function ( result_map ) { response.send(result_map) }
        )
    });

    app.get('/:obj_type/read/:id([0-9]+)', function ( request, response ) {
        crud.read(
            request.params.obj_type,
            {_id : makeMongoId(request.params.id )},
            {},
            function ( map_list ) { response.send( map_list ) }
        )
    });

    app.post('/:obj_type/update/:id([0-9]+)', function ( request, response ) {
        crud.update(
            request.params.obj_type,
            {_id : makeMongoId( request.params.id )},
            request.body,
            function ( result_map ) { response.send( result_map ); }
        )
    });

    app.get('/:obj_type/delete/:id([0-9]+)', function ( request, response ) {
        crud.destory(
            request.params.obj_type,
            {_id  : makeMongoId( request.params.id )},
            function ( result_map ) { response.send( result_map ) }
        )
    });
    chat.connect(server);
};

module.exports = { configRoutes : configRoutes };
dbHandle.close();
dbHandle.open( function () {
    console.log('** Connected to MongoDB **');
});
