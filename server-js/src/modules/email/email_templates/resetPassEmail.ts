const generateResetPassEmail = (data: any) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>Email Confirmation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Oswald:wght@200..700&family=PT+Mono&family=Protest+Guerrilla&display=swap"
      rel="stylesheet"
    />
    <style type="text/css">
      body,
      table,
      td,
      a {
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
        font-family: 'Oswald', serif;
      }
      table,
      td {
        mso-table-rspace: 0pt;
        mso-table-lspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
      }
      a[x-apple-data-detectors] {
        font-family: inherit !important;
        font-size: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
        color: inherit !important;
        text-decoration: none !important;
      }
      div[style*='margin: 16px 0;'] {
        margin: 0 !important;
      }
      body {
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      table {
        border-collapse: collapse !important;
      }
      a {
        color: #1a82e2;
      }
      img {
        height: auto;
        line-height: 100%;
        text-decoration: none;
        border: 0;
        outline: none;
      }
    </style>
  </head>
  <body style="background-color: #e9ecef">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" bgcolor="#e9ecef">
          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="max-width: 600px"
          >
            <tr>
              <td align="center" valign="top" style="padding: 36px 24px">
                <a
                  href="${data.client}"
                  target="_blank"
                  style="display: inline-block"
                >
                  <img
                    src="${data.client}/logo.svg"
                    alt="Logo"
                    border="0"
                    width="200"
                  />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center" bgcolor="#e9ecef">
          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="max-width: 600px"
          >
            <tr>
              <td
                align="left"
                bgcolor="#ffffff"
                style="padding: 36px 24px 0; border-top: 3px solid #d4dadf"
              >
                <h1
                  style="
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: -1px;
                    line-height: 48px;
                  "
                >
                  Сброс пароля
                </h1>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" bgcolor="#e9ecef">
          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="max-width: 600px"
          >
            <tr>
              <td
                align="left"
                bgcolor="#ffffff"
                style="padding: 24px; font-size: 16px; line-height: 24px"
              >
                <p style="margin: 0">
                  Нажмите кнопку ниже для сброса пароля вашего аккаунта. Если вы не
                  запрашивали сброс, игнорируйте это письмо.
                </p>
              </td>
            </tr>
            <tr>
              <td align="left" bgcolor="#ffffff">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" bgcolor="#ffffff" style="padding: 12px">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td
                            align="center"
                            bgcolor="#1a82e2"
                            style="border-radius: 6px"
                          >
                            <a
                              href="${data.link}"
                              target="_blank"
                              style="
                                display: inline-block;
                                padding: 16px 36px;
                                font-size: 16px;
                                color: #ffffff;
                                text-decoration: none;
                                border-radius: 6px;
                              "
                              >Подтвердить</a
                            >
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                align="left"
                bgcolor="#ffffff"
                style="padding: 24px; font-size: 16px; line-height: 24px"
              >
                <p style="margin: 0">
                  Если кнопка не работает, скопируйте и вставьте следующую ссылку в браузер:
                </p>
                <p style="margin: 0">
                  <a
                    href="${data.link}"
                    target="_blank"
                    >${data.link}</a
                  >
                </p>
              </td>
            </tr>
            <tr>
              <td
                align="left"
                bgcolor="#ffffff"
                style="
                  padding: 24px;
                  font-size: 16px;
                  line-height: 24px;
                  border-bottom: 3px solid #d4dadf;
                "
              >
                <p style="margin: 0">
                  С уважением,<br />
                  ваш PEXpert
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </body>
</html>
`

export default generateResetPassEmail
