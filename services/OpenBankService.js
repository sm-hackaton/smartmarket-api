var oauth = require('oauth');

// To get the values for the following fields, please register your client here:
// https://apisandbox.openbankproject.com/consumer-registration
var baseUrl = 'https://apisandbox.openbankproject.com';

module.exports = function(confirmUrl, consumerKey, consumerSecret) {
    var consumer = new oauth.OAuth(
        baseUrl+'/oauth/initiate',
        baseUrl+'/oauth/token',
        consumerKey, // _openbankConsumerKey,
        consumerSecret, // _openbankConsumerSecret,
        '1.0', //rfc oauth 1.0, includes 1.0a
        confirmUrl,
        'HMAC-SHA1');

    return {
        getRequestToken: function(next) {
            consumer.getOAuthRequestToken(function(err, requestToken, requestTokenSecret) {
                if (err) {
                    next(err);
                } else {
                    next(null, requestToken, requestTokenSecret);
                }
            });
        },
        getAuthorizeUrl: function(requestToken) {
            return baseUrl+'/oauth/authorize?oauth_token='+requestToken;
        },
        getAccessToken: function(requestToken, requestSecret, requestVerifier, next) {
            consumer.getOAuthAccessToken(
                requestToken,
                requestSecret,
                requestVerifier,
                function(err, accessToken, accessTokenSecret) {
                    if (err) return next(err);
                    next(null, accessToken, accessTokenSecret);
                }
            );
        },
        getBanks: function(account, next) {
            var url = baseUrl+'/obp/v1.2.1/banks';
            consumer.get(url, account.access_token, account.access_secret, function(err, data) {
                if (err) throw err;
                next(null, JSON.parse(data).banks);
            });
        },
        getViews: function(account, next) {
            var url = baseUrl+'/obp/v1.2.1/banks/'+account.bank_id+'/accounts/'+account.account_id+'/views';
            consumer.get(url, account.access_token, account.access_secret, function(err, data) {
                if (err) throw err;
                next(null, JSON.parse(data));
            });
        },
        getTransactions: function(account, next) {
            var url = baseUrl+'/obp/v1.2.1/banks/'+account.bank_id+'/accounts/'+account.account_id+'/owner/transactions';
            consumer.get(url, account.access_token, account.access_secret, function(err, data) {
                if (err) throw err;
                next(null, JSON.parse(data));
            });
        },
        createTransaction: function(account, fields, next) {
            var url = baseUrl+'/obp/v1.2.1/banks/'+account.bank_id+'/accounts/'+account.account_id+'/owner/transactions';
            consumer.post(url, account.access_token, account.access_secret, fields, function(err, data) {
                if (err) throw err;
                next(null, JSON.parse(data));
            });
        }
    }
};
