'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.makeFetchDriver = makeFetchDriver;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function getUrl(request) {
  return request.input && request.input.url || request.url;
}

function normalizeRequest(input) {
  var request = typeof input === 'string' ? { url: input } : _extends({}, input);
  if (!request.key) {
    request.key = getUrl(request);
  }
  return request;
}

function byKey(response$$, key) {
  return response$$.filter(function (response$) {
    return response$.request.key === key;
  });
}

function byUrl(response$$, url) {
  return response$$.filter(function (response$) {
    return getUrl(response$.request) === url;
  });
}

function isolateSink(request$, scope) {
  return request$.map(function (request) {
    if (typeof request === 'string') {
      return { url: request, _namespace: [scope] };
    }
    request._namespace = request._namespace || [];
    request._namespace.push(scope);
    return request;
  });
}

function isolateSource(response$$, scope) {
  var isolatedResponse$$ = response$$.filter(function (response$) {
    return Array.isArray(response$.request._namespace) && response$.request._namespace.indexOf(scope) !== -1;
  });
  isolatedResponse$$.isolateSource = isolateSource;
  isolatedResponse$$.isolateSink = isolateSink;
  return isolatedResponse$$;
}

// scheduler option is for testing because Reactive-Extensions/RxJS#976

function makeFetchDriver(scheduler) {
  return function fetchDriver(request$) {
    var response$$ = new _rx2['default'].ReplaySubject(1);
    request$.map(normalizeRequest).subscribe(function (request) {
      var input = request.input;
      var url = request.url;
      var init = request.init;

      var response$ = _rx2['default'].Observable.fromPromise(global.fetch(input || url, init), scheduler);
      response$.request = request;
      response$$.onNext(response$);
    }, response$$.onError.bind(response$$), response$$.onCompleted.bind(response$$));
    response$$.byKey = byKey.bind(null, response$$);
    response$$.byUrl = byUrl.bind(null, response$$);
    response$$.isolateSource = isolateSource;
    response$$.isolateSink = isolateSink;
    return response$$;
  };
}