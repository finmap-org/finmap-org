// Share link
const shareLink = document.getElementById("share");
const thisTitle = document.title;
shareLink.addEventListener("click", handleShareClick);

function handleShareClick(event) {
  if (navigator.share) {
    navigator
      .share({
        title: thisTitle,
        url: url,
      })
      .catch(console.error);
  } else {
    alert("Web Share API is not supported");
  }
}
