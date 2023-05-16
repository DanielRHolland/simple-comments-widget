(import
  scheme (chicken base)
  (chicken port) (chicken random) (chicken time)
  (chicken process-context)
  spiffy intarweb uri-common
  sqlite3
  medea
  srfi-1 ;list functions
)

;; db open and create
(define db (open-database (or (get-environment-variable "DB_FILE") "/tmp/comments.db")))

; Creates table automatically on initial run
(execute db "CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                page_id TEXT,
                content TEXT,
                deletion_key TEXT,
                created_at DATETIME default current_timestamp
            )")

; creates a new almost-certainly-unique & chronologically ordered id
(define (gen-id)
  (+ (pseudo-random-integer 65536)
     (* (current-seconds) 100000)))

; inserts comment into db
(define (create-comment page-id content deletion-key)
  (let ([id (gen-id)]
        [content-or-empty (if (or (not content) (eof-object? content))
                            ""
                            content)])
    (execute db "INSERT INTO comments
             (id, page_id, content, deletion_key)
             VALUES (?, ?, ?, ?)"
             id page-id content-or-empty deletion-key)
    id))

; turns db row into list of key-value pairs
(define (comment-row->alist id page-id content created-at)
  `((id . ,id)
    (page_id . ,page-id)
    (created_at . ,created-at)
    (content . ,content)))

; selects all comments with the given page-id
(define (get-comments page-id)
  (map-row comment-row->alist db
           "SELECT c.id, c.page_id, c.content, c.created_at
           FROM comments c
           WHERE c.page_id = ?
           ORDER BY c.created_at DESC"
           page-id
           ))

; deletes any comment with the comment-id and deletion-key given, if any exist
(define (delete-comment comment-id deletion-key)
  (execute db "DELETE FROM comments
           WHERE id = ?
           AND deletion_key = ?"
           comment-id deletion-key))

; get query string parameter
(define (get-req-var k)
  (alist-ref k (uri-query (request-uri (current-request)))))

; get page_id query string parameter
(define (get-page-id)
  (get-req-var 'page_id))

; read current-request body as json. Arrays represented as lists, objects as alists
(define (read-json-body)
  (read-json (request-port (current-request)) consume-trailing-whitespace: #f))

; get alist value with key of k
(define (json-value-ref json-alist k)
  (and (list? json-alist) (alist-ref k json-alist equal? #f)))

; headers to always add to responses
(define base-headers
  '((access-control-allow-origin *)
    (access-control-allow-credentials true)
    (access-control-allow-methods GET POST OPTIONS DELETE)
    (access-control-allow-headers content-type)))

; list of allowed routes, first item is method, second is uri, third is handler function
(define routes
  `(
    (OPTIONS (/ "comments") ,(lambda () 
                               (send-response
                                 status: 'ok
                                 headers:  base-headers)))

    (POST (/ "comments") ,(lambda ()
                            (let* ([json-body (read-json-body)]
                                   [page-id (json-value-ref json-body 'page_id)]
                                   [content (json-value-ref json-body 'content)]
                                   [deletion-key (json-value-ref json-body 'deletion_key)]
                                   [bot? (not (equal? "no" (json-value-ref json-body 'bot)))])
                              (if bot?
                                (send-status 'bad-request)
                                (send-response
                                  status: 'ok
                                  body: (number->string
                                          (create-comment page-id content deletion-key))
                                  headers: base-headers)))))

    (GET (/ "comments") ,(lambda ()
                           (let* ([page-id (get-page-id)]
                                  [comments (list->vector (get-comments page-id))])
                             (send-response
                               headers:  (cons
                                           '(content-type application/json)
                                           base-headers)
                               status: 'ok
                               body: (with-output-to-string
                                       (lambda () (write-json comments))))
                             )))
    (DELETE (/ "comments") ,(lambda ()
                              (let (
                                    [comment-id (get-req-var 'comment)]
                                    [deletion-key (get-req-var 'deletion_key)])
                                (delete-comment comment-id deletion-key)
                                (send-response
                                  status: 'no-content
                                  headers: base-headers)
                                )))
    ))

; find route with matching uri and method, or return #f
(define (find-route uri method)
  (find
    (lambda (r)
      (and
        (equal?
          method
          (first r))
        (equal?
          (uri-path uri)
          (second r))))
    routes))

; handle a new HTTP request
(define (handle continue)
  (let* ([req (current-request)]
         [uri (request-uri req)]
         [method (request-method req)]
         [route (find-route uri method)])
    (if route
      ((third route))
      (begin (display uri) (display method) (send-status 'not-found "Page Not Found")))))

(root-path ".")
(vhost-map `((".*" . ,handle)))
(start-server port: 7060)
