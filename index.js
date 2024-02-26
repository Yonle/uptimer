const http = require("http");
const undici = require("undici");
const fs = require("fs");

const greeting = (fs.existsSync(__dirname + "/greeting.txt") ? fs.readFileSync(__dirname + "/greeting.txt", "utf8") : "Website Status") + "\n\n";
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
    async () => {
      try {
        const req = await undici.request(i[0], {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.0.0 Mobile Safari/537.36",
          },
        });
        if (req.statusCode >= 400) throw `status code: ${req.statusCode}`;
        int.err = null;
        int.ok = true;
        int.lc = new Date().toLocaleString('en-UK', { timeZone: 'UTC' });
      } catch (err) {
        if (int.err == e.toString()) return;
        int.ok = false;
        int.err = e.toString();
        int.lc = new Date().toLocaleString('en-UK', { timeZone: 'UTC' });
      }
    },
    Number(i[1] || 1000 * 60)
  );

  int.name = i.slice(2)?.join(" ") || i[0];
  urls.push(int);
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.write(greeting);
  if (!urls.length)
    return res.end("This uptimer server is not configured yet.\n");
  urls.forEach((int) => {
    if (!int.ok && !int.err)
      return res.write(" - " + "WAIT " + "| " + int.name + "\n");
    res.write(" - " + (int.ok ? "OK   " : "DOWN ") + "| " + int.name + " at " + int.lc + "\n");
  });

  if (urls.filter((i) => i.err).length)
    res.write("\nWebsite Downtimes & Error\n");
  urls
    .filter((i) => i.err)
    .forEach((int) => {
      res.write(" - " + int.name + " at " + int.lc + "\n");
      res.write("   " + int.err + "\n\n");
    });
  res.end();
});

const listener = server.listen(process.env.PORT || 3000, _ =>
  console.log("Uptimer status is now listening at port", listener.address().port));
