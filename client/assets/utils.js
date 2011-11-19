function clean( string ) {
  result =
    string
      .replace(/&/g, "&amp;")
      .replace(/>/g, "&gt;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;")
      .replace(/"/g, "&quot;")
      .replace(/\s/g, "&nbsp;");
  
  return result;
}
