## simple-comments-widget

Two parts, a server `main.scm`, written in Chicken Scheme, and a frontend written in html+js+css.

### Running the application

To start the server, run `make run`.
To start the client, open `client.html` in a web browser.

The server, `main.scm` requires the following 'eggs' (i.e. Chicken Scheme packages): `spiffy intarweb uri-common sqlite3 medea srfi-1`.

The server relies on sqlite3, this needs to be present on the system and linked by the compiler. e.g. `chicken-csc -static ./main.scm -L -lsqlite3`

The frontend doesn't need any compilation, or even hosting, it should work if you just open it in any modern web browser.

The provided html file is intended as an example usage. In practice, one would probably want to embed the comments form & thread inside another page (and most likely restyle them!).

### License

Released into the public domain.

Monday 15th May 2023
