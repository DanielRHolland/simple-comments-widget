// Default config
var config = {
    "base_url": "http://localhost:7060/comments",
    "page_id": "add-page-id-here"
}


// github pages config
if (window.location.href === 'https://danielrholland.github.io/simple-comments-widget/client.html'){
  config = {
    base_url : 'https://comments.dotemgo.com/comments',
    page_id : 'https://danielrholland.github.io/simple-comments-widget/client.html'
  };
}
console.log(window.location.href)
