if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(target, firstSource) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert first argument to object');
            }

            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource === undefined || nextSource === null) {
                    continue;
                }

                var keysArray = Object.keys(Object(nextSource));
                for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                    var nextKey = keysArray[nextIndex];
                    var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                    if (desc !== undefined && desc.enumerable) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
            return to;
        }
    });
}

//TODO headers - Additional HTTP request headers.
//TODO static method create(with assign)
//TODO promises support
var REST_CRUD = (function (win) {
    // The HTTP request method to use
    var _requestMethod;

    // The URL to handle the request
    var _host = '';
    var _port = '';
    var _path = '/';
    var _query = '';

    // For disabling browser caching
    var _cacheBust;

    /**
     * Check if given object has given type
     *
     * @example 
     * is('String', 'test');
     *
     * @param {String} type - type description
     * @param {Object} obj
     * @returns {boolean}
     */
    var is = function(type, obj) {
        var typeString = Object.prototype.toString.call(obj).slice(8, -1);

        return obj !== undefined && obj !== null && typeString === type;
    };

    /**
     * @param {Number} state
     *
     * @returns {String}
     */
    var getXhrStateDescription = function (state) {
        switch (state) {
            case 0:
                return 'UNSENT';
            case 1:
                return 'OPENED';
            case 2:
                return 'HEADERS_RECEIVED';
            case 3:
                return 'LOADING';
            case 4:
                return 'DONE';
            default:
                return '';
        }
    };

    /**
     * @param {Object} obj
     *
     * @returns {string}
     */
    var encodeQueryParams = function (obj) {
        var str = "";

        for (var key in Object.keys(obj)) {
            if (str != "") {
                str += "&";
            }

            str += key + "=" + encodeURIComponent(obj[key]);
        }

        return str;
    };

    /**
     * @param {String} method
     * @param {String} url
     *
     * @returns {XMLHttpRequest}
     */
    var createCORSRequest = function(method, url) {
        var xhr = new XMLHttpRequest();

        if ("withCredentials" in xhr) {
            // Most browsers.
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            // IE8 & IE9
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            // CORS not supported.
            xhr = null;
        }

        return xhr;
    };

    var prepareUrl = function() {
        var cacheBustEnding = '';

        if (_query) {
            _query = '?' + (is('Object', _query) ? encodeQueryParams(_query) : _query);
        }

        if (_cacheBust) {
            cacheBustEnding = (_query ? '&' : '?') + 'd=' + (new Date()).getTime();
        }

        return _host + _port + _path + _query + cacheBustEnding
    };

    /**
     * @param {Function} callback
     * @param {String|Object|Array} body - The HTTP request body (applies to PUT or POST).
     */
    var createRequest = function (callback, body) {
        callback = callback || function (err, xhr) {};
        body = body || null;

        if (body && !is('String', body)) {
            body = JSON.stringify(body);
        }

        var xhr = createCORSRequest(
            _requestMethod,
            prepareUrl()
        );

        xhr.onerror = function(e) {
            callback(e.target);
        };

        xhr.onload = function (e) {
            var xhr = e.target;
            var err = null;

            if (xhr.status !== 200) {
                err = xhr;
            }

            callback(err, xhr);
        };

        if(win.DEBUG) {
            xhr.onreadystatechange = function () {
                console.log('url:', prepareUrl());
                console.log('method:', _requestMethod);
                console.log(getXhrStateDescription(xhr.readyState));
                console.log('status:', xhr.status);
                console.log('--------------------');
            };
        }

        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send(body);
    };

    return {
        //Config
        //--------------------------------------------------------------------------------------------------------------

        /**
         * @param {String} domain
         *
         * @returns {REST_CRUD}
         */
        setHost: function (domain) {
            _host = domain;

            return this;
        },

        /**
         * @param {String} port
         *
         * @returns {REST_CRUD}
         */
        setPort: function (port) {
            _port = ':' + port;

            return this;
        },

        /**
         * @param {String} path
         *
         * @returns {REST_CRUD}
         */
        setPath: function(path) {
            _path = path;

            return this;
        },

        /**
         * @param {Object|String} query
         *
         * @returns {REST_CRUD}
         */
        setQuery: function(query) {
            _query = query;

            return this;
        },

        /**
         * @param {Boolean} cacheBust
         *
         * @returns {REST_CRUD}
         */
        setCacheBust: function(cacheBust) {
            _cacheBust = cacheBust;

            return this;
        },


        //REST Methods
        //--------------------------------------------------------------------------------------------------------------

        /**
         * @param {Function} callback
         * @param {String|Object|Array} body
         * @returns {REST_CRUD}
         */
        create: function (callback, body) {
            _requestMethod = 'POST';
            createRequest(callback, body);

            return this;
        },

        /**
         * @param {Function} callback
         * @returns {REST_CRUD}
         */
        read:   function (callback) {
            _requestMethod = 'GET';
            createRequest(callback);

            return this;
        },

        /**
         * @param {Function} callback
         * @param {String|Object|Array} body
         * @returns {REST_CRUD}
         */
        update: function (callback, body) {
            _requestMethod = 'PUT';
            createRequest(callback, body);

            return this;
        },

        /**
         * @param {Function} callback
         * @returns {REST_CRUD}
         */
        remove: function (callback) {
            _requestMethod = 'DELETE';
            createRequest(callback);

            return this;
        }
    };
})(window);
