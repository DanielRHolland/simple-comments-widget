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

function deleteButton(x) {
  const el = document.createElement('button');
  el.style = 'float:right;';
  el.onClick = () => handleDelete(x.id, x.deletion_key);
  el.innerText = 'delete';
  return el;
}

function commentFmt (x) {
  const el = document.createElement('div');
  el.classList.add('comment');
  el.id = `comment${x.id}`;
  el.replaceChildren(
    x.content,
    document.createElement('br'),
    x.created_at
  );
  if (getDeletionKeys()[x.id]) {
    el.appendChild(deleteButton(x));
  }
  return el;
}

function commentsRender() {
  const el = document.createElement('div');
  comments.forEach(x => el.appendChild(commentFmt(x)));
  commentsthread.replaceChildren(el);
  el.id = 'commentsthreadinner'
}

/* API calls */

// GET comments
function fetchComments() {
  fetch(`${config.base_url}?page_id=${config.page_id}`)
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
      page_id: config.page_id,
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
