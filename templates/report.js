
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
          var parents = Array.prototype.slice.call(
            tbody.querySelectorAll("tr:not(.tot):not(.breakdown-row)"),
          );
          var blocks = parents.map(function (parent) {
            var rows = [parent];
            var sibling = parent.nextElementSibling;
            while (sibling &&
              sibling.classList.contains("breakdown-row")) {
              rows.push(sibling);
              sibling = sibling.nextElementSibling;
            }
            return { parent: parent, rows: rows };
          });

          blocks
            .sort(function (a, b) {
              return numberFrom(b.parent.cells[8].textContent) -
                numberFrom(a.parent.cells[8].textContent);
            })
            .forEach(function (block, index) {
              block.parent.cells[0].textContent = String(index + 1);
              var childIndex = 0;
              block.rows.forEach(function (row) {
                if (row.classList.contains("breakdown-row")) {
                  childIndex += 1;
                  row.cells[0].textContent = String(index + 1) + "." + childIndex;
                }
                tbody.insertBefore(row, total);
              });
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
