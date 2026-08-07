
      (function () {
        "use strict";

        function numberFrom(text) {
          return Number(String(text || "").replace(/[^\d.-]/g, "")) || 0;
        }

        document.querySelectorAll("table tbody tr:not(.tot)").forEach(function (row) {
          var cell = row.cells[row.cells.length - 1];
          var value = cell ? cell.textContent.trim() : "";
          var match = value.match(
            /(?:Rate 1:|GNF-to-USD conversion at 1 USD = GNF )([\d,]+)/,
          );

          if (match) {
            cell.textContent = "1 : " + match[1].replace(/,/g, "");
          } else if (/^USD payment$/i.test(value)) {
            cell.textContent = "\u2014";
          }
        });

        document.querySelectorAll(".tw tbody").forEach(function (tbody) {
          var total = tbody.querySelector(".tot");
          var rows = Array.prototype.slice.call(
            tbody.querySelectorAll("tr:not(.tot)"),
          );

          rows
            .sort(function (a, b) {
              return numberFrom(b.cells[7].textContent) -
                numberFrom(a.cells[7].textContent);
            })
            .forEach(function (row, index) {
              row.cells[0].textContent = String(index + 1);
              tbody.insertBefore(row, total);
            });
        });

        var panel = document.querySelector(".panel");
        var rougeTotal = panel && panel.querySelector(".rouge-total");

        if (panel && rougeTotal) {
          Array.prototype.slice
            .call(panel.querySelectorAll(".br.sub:not(.rouge-detail)"))
            .sort(function (a, b) {
              return numberFrom(b.querySelector(".amt").textContent) -
                numberFrom(a.querySelector(".amt").textContent);
            })
            .forEach(function (row) {
              panel.insertBefore(row, rougeTotal);
            });
        }
      })();
