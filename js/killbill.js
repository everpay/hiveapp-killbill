function showSuccessMessage(message) {
  hideMessages();

  $('#messages-alert-success').text(message);
  $('#messages-alert-success').show();
}

function showErrorMessage(message) {
  hideMessages();

  $('#messages-alert-error').text(message);
  $('#messages-alert-error').show();
}

function hideMessages() {
  $('#messages-alert-error').hide();
  $('#messages-alert-success').hide();
}

function getAuthToken() {
  return localStorage.getItem('killbill.token');
}

function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem('killbill.token');
  } else {
    localStorage.setItem('killbill.token', token);
  }
}

function doKillbillAuth(address, password) {
  // TODO Demo only...
  if (true) {
    return 'dummy-token';
  } else {
    return null;
  }
}

function authIfNeeded() {
  $('#userdata').hide();

  var address;
  bitcoin.getUserInfo(function(info) {
    address = info.address;
  });

  var token = getAuthToken();
  if (token === null) {
    hideMessages();

    // Hide the login form
    $('#signin-container').show();

    // Pre-populate the form with the user's bitcoin address
    $('input#btc_address').val(address);

    $("#signin-submit").click(function(e) {
      address = $('#btc_address').val();
      password = $('#password').val();

      token = doKillbillAuth(address, password);
      if (token === null) {
        $('#signin-container').show();

        showErrorMessage('Unable to log-in :(');
      } else {
        setAuthToken(token);

        // Hide the login form
        $('#signin-container').hide();
        // Show the logout link
        $('#logout').show();

        showSuccessMessage('Successfully logged-in!');

        // Get the latest state
        fetchKillBillData(address);
      }

      e.preventDefault();
    });
  } else {
    hideMessages();

    // Hide the login form
    $('#signin-container').hide();
    // Show the logout link
    $('#logout').show();

    // Get the latest state
    fetchKillBillData(address);
  }
}

function fetchKillBillData(address) {
  K.Account.getByExternalKey(address,
                             function(err, account) {
                               if (err) {
                                 $('#userdata').hide();
                                 showErrorMessage(err);
                                 return;
                               }

                               populateAccountData(account);
                               populatePaymentData(account);

                               $('#userdata').show();
                             });
}

function populateAccountData(account) {
  $('#account-name').text(account.name);
  $('#account-email').text(account.email);
  $('#account-city').text(account.city);
  $('#account-country').text(account.country);
}

function populatePaymentData(account) {
   K.Payment.getByAccountId(account.accountId,
                            function(err, payments) {
                              if (err) {
                                $('#userdata').hide();
                                showErrorMessage(err);
                                return;
                              }

                              $("#payments-table").find("tr:gt(0)").remove();
                              $.each(payments, function(i, payment) {
                                var effectiveDate = new Date(Date.parse(payment.effectiveDate));
                                var prettyDate = (effectiveDate.getMonth() + 1) + "/" + effectiveDate.getDate() + "/" + effectiveDate.getFullYear();

                                var tr = $('<tr>').attr('id', 'payment-' + payment.paymentNumber)
                                                  .attr('class', payment.status == 'SUCCESS' ? 'success' : 'danger')
                                                  .append($('<td>').text(payment.amount + ' ' + payment.currency))
                                                  .append($('<td>').text(prettyDate))
                                                  .append($('<td>').text(payment.status == 'SUCCESS' ? 'Success' : 'Error'));
                                $('#payments-table > tbody:last').append(tr);
                              });
                            });
}

jQuery(document).ready(function($) {
  // Setup the log-out link
  $("#logout").click(function(e) {
    setAuthToken(null);

    // Reset the screen
    authIfNeeded();
    showSuccessMessage('You are now logged out!');

    // Hide the menu
    $('#menu').collapse('hide');

    e.preventDefault();
  });

  // Check if the user is logged-in
  authIfNeeded();
});