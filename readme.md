## simple-comments-widget

This is a comments component for adding to web pages, plus a backend service that stores comments in a database.

Users can delete their own comments, but the server does not save any user information. This is acheived by generating a key for every new comment, which is cached in the browser of the creator, and also stored in the server's database. Deletion HTTP requests must include this number, as well as the comment's id.

### Server HTTP API

- `GET /comments?page_id=add-page-id-here` : returns a json array of comments for the page 'add-page-id-here'.
- `POST /comments` : takes a json body of the form `{"bot":"no", "content": "foo bar", "deletion_key": "3858516384593962266", "page_id":"add-page-id-here"}`. Creates a comment and returns plain text containing the id of the new comment.
- `DELETE /comments?comment=168424640753280&deletion_key=3858516384593962266` : deletes the comment with the provided id (`comment`) and `deletion_key`, if it exists (has no effect if no such comment exists). Should always return `204`.

### Running the application

The system has two parts, a server `main.scm`, written in Chicken Scheme, and a frontend written in html+js+css.

To start the server, run `make run`.
To start the client, open `client.html` in a web browser.

The server, `main.scm` requires the following 'eggs' (i.e. Chicken Scheme packages): `spiffy intarweb uri-common sqlite3 medea srfi-1`.

The server relies on sqlite3, this needs to be present on the system and linked by the compiler. e.g. `chicken-csc -static ./main.scm -L -lsqlite3`

The frontend doesn't need any compilation, or even hosting, it should work if you just open it in any modern web browser.

The provided html file is intended as an example usage. In practice, one would probably want to embed the comments form & thread inside another page (and most likely restyle them!).

### License

Released into the public domain.

Monday 15th May 2023
