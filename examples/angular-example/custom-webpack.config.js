const webpack = require('webpack');

module.exports = {
    resolve: {
       fallback: {
           stream: false,
           crypto: false,
       }
    },
    
};