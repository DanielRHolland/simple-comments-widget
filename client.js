/* Config */
const baseUrl = 'https://comments.dotemgo.com/comments';
const pageId = '{{site-url}}{{uri}}';
const commentsUrl = `${baseUrl}?page_url=${pageId}`;


/* State */
let comments = [];

/* GUI components */

const deleteButton = x =>
  `<button style='float:right;' onclick='handleDelete("${x.id}", "${x.deletion_key}")'>`+
    `delete</button>`;

const commentFmt = x =>
  `<div class='comment' id='comment${x.id}'>${x.content}<br/>${x.created_at}`+
    `${x.deletion_key  ? deleteButton(x) :''}</div>`;

function commentsRender() {
  commentsthread.innerHTML =
    `<div id='commentsthreadinner'>
                    ${comments.map(commentFmt).join('')}
                </div>`;
}


/* API calls */

// GET comments
function fetchComments() {
  fetch(commentsUrl)
    .then(r => r.ok && r.json())
    .then(xs => {
      comments = xs;
      if (comments.length) {
        commentsRender();
      }
    })
}

// POST new comment
function createComment(comment) {
  const xs = new BigUint64Array(1);
  crypto.getRandomValues(xs);
  comment.deletion_key = xs[0].toString();
  fetch(baseUrl, {
    method: 'POST',
    body: JSON.stringify(comment),
    headers: {'content-type': 'application/json'}
  }).then(r => r.ok && r.text())
    .then(id => {
      const newComment = {id, created_at: 'just now', ...comment}
      comments = [newComment, ...comments];
      commentsRender();
    })
}

/* Action Handlers */

function handleCommentFormSubmit() {
  if (commentcontent.value !== "") {
    createComment({page_url: pageId, content: commentcontent.value});
    commentcontent.value = '';
  }
}

// DELETE comment
function handleDelete(commentId, deletionKey) {
  console.log('deleting:',{commentId,deletionKey});
  fetch(
    `${baseUrl}?comment=${commentId}&deletion_key=${deletionKey}`,
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
