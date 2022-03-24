const http = require("http");
const get = require("miniget");
const fs = require("fs");

const urls = Array();

// Parse the URLS in the files
const parsed = fs
  .readFileSync(__dirname + "/urls.txt", "utf8")
  .split("\n")
  .filter((i) => i.length && !i.startsWith("#"))
  .map((i) => i.split(" "));

parsed.forEach((i) => {
  // This is the format:
  // i[0] = URL
  // i[1] = Interval (in miliseconds)

  let int = setInterval(
    () =>
      get(i[0], {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.0.0 Mobile Safari/537.36",
        },
      })
        .on("response", () => {
          int.err = null;
          int.ok = true;
          int.lc = new Date().toLocaleString('en-UK', { timeZone: 'UTC' });
        })
        .on("error", (e) => {
          if (int.err == e.toString()) return;
          int.ok = false;
          int.err = e.toString();
          int.lc = new Date().toLocaleString('en-UK', { timeZone: 'UTC' });
        }),
    Number(i[1] || 1000 * 60)
  );

  int.url = i[0];
  urls.push(int);
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.write("Website Status\n");
  if (!urls.length)
    return res.end("This uptimer server is not configured yet.\n");
  urls.forEach((int) => {
    let url = new URL(int.url).host;
    if (!int.ok && !int.err)
      return res.write(" - " + "WAIT " + "| " + url + "\n");
    res.write(" - " + (int.ok ? "OK   " : "DOWN ") + "| " + url + "\n");
    res.write("   " + "Last checked at " + int.lc + "\n");
  });

  if (urls.filter((i) => i.err).length)
    res.write("\nWebsite Downtimes & Error\n");
  urls
    .filter((i) => i.err)
    .forEach((int) => {
      let url = new URL(int.url).host;
      res.write(" - " + url + " at " + int.lc + "\n");
      res.write("   " + int.err + "\n\n");
    });
  res.end();
});

server.listen(3000);
