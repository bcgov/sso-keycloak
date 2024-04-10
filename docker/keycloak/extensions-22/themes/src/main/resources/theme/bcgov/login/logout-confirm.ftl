<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body>
    <form class="form-actions" action="${url.logoutConfirmAction}" method="POST">
      <input type="hidden" name="session_code" value="${logoutConfirm.code}" />
      <input type="submit" name="confirmLogout" id="kc-logout" value="${msg("doLogout")}"/>
    </form>
    <script>
      document.addEventListener('DOMContentLoaded', function (event) {
        const logoutElem = document.getElementById('kc-logout');
        if (logoutElem) {
          logoutElem.style.visibility = 'hidden';
          logoutElem.click();
        }
      });
    </script>
  </body>
</html>
