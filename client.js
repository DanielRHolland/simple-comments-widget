/* Running State */
let comments = [];
 
/* LocalStorage Access */

function getDeletionKeys() {
    return (localStorage.deletion_keys && JSON.parse(localStorage.deletion_keys)) || {};
}

function setDeletionKey(commentId, key) {
    const keys = getDeletionKeys();
    keys[commentId] = key;
    localStorage.deletion_keys = JSON.stringify(keys);
}

/* GUI components */

const deleteButton = x =>
  `<button style='float:right;' onclick='handleDelete("${x.id}", "${x.deletion_key}")'>`+
    `delete</button>`;

const commentFmt = x =>
  `<div class='comment' id='comment${x.id}'>${x.content}<br/>${x.created_at}`+
    `${getDeletionKeys()[x.id] ? deleteButton(x) :''}</div>`;

function commentsRender() {
  commentsthread.innerHTML =
    `<div id='commentsthreadinner'>
                    ${comments.map(commentFmt).join('')}
                </div>`;
}

/* API calls */

// GET comments
function fetchComments() {
  fetch(`${config.base_url}?page_url=${config.page_id}`)
    .then(r => r.ok && r.json())
    .then(xs => {
      comments = xs;
      if (comments.length) {
        commentsRender();
      }
    })
}

// only 64 bits so not very strong
function generateRandomKey() {
  const xs = new BigUint64Array(1);
  crypto.getRandomValues(xs);
  return xs[0].toString();
}

// POST new comment
function createComment(comment) {
  comment.deletion_key = generateRandomKey();
  fetch(config.base_url, {
    method: 'POST',
    body: JSON.stringify(comment),
    headers: {'content-type': 'application/json'}
  }).then(r => r.ok && r.text())
    .then(id => {
      const newComment = {id, created_at: 'just now', ...comment}
      comments = [newComment, ...comments];
      setDeletionKey(id, comment.deletion_key);
      commentsRender();
    })
}

/* Action Handlers */

function handleCommentFormSubmit() {
  if (commentcontent.value !== "") {
    createComment({
      page_url: config.page_id,
      content: `${commentcontent.value}\n - ${username.value}`,
      bot: bot.value
    });
    commentcontent.value = '';
  }
}

// DELETE comment
function handleDelete(commentId, deletionKey) {
  fetch(
    `${config.base_url}?comment=${commentId}&deletion_key=${deletionKey}`,
    {method: 'DELETE'}
  ).then(r => {
    if (r.ok) {
      comments = comments.filter(x => x.id !== commentId);
      commentsRender();
    }
  });
}

/* init */
fetchComments();
