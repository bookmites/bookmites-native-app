# **How we think about Book-Quote Objects.**

### **Our perspective on Users**
We believe that people are quote-collectors (especially when reading classics, philosophy, and political books). We believe that people want to be able to:
- Highlight when they believe they've read something profound
- Find their past highlights when they want to be reminded of how something was phrased. 
- Share their highlights on social media, in group chats, or with their notes on other platforms. 
- Be reminded of something that they've highlighted in the past. 
- Organize their highlights as part of writing projects or other art projects. 
- Discuss the things that they've read with AI
- Annotate the things that they highlight. 

We believe that the books people will use our app to read are books that will be read slowly and multiple times. Books that people want to remember and use to contextualize their lives. Quotes from books are part of how people keep books "living" even when they're not reading them. 

--------------------------------------------------

### **What this means for our architecture.**
This means that quoted text from books is not a "child" of a book in our architecture—it is a peer object that belongs to the user and is linked to a book with a location and the book's metadata. 

The term that we use for direct text from a book is `BookQuote`.

As the app grows, `BookQuotes` will be visible:
- **In Reader** as **Highlights** when the user is reading, they can see the text (`BookQuote`s) that they've previously highlighted. 
- **In the Notebook** as a large list of everything users have saved (highlighted) from across all of their books. They can view and organize these as well as add tags, annotations, and more. 
- **On the home page** as friendly reminders of things that they've read (and highlighted) in the past. 
- **In AI Chats** when having discussions with AI, it can query the `BookQuote`s in their notebook and pull those into conversation for futher idea development. 


--------------------------------------------------

### **Terminiology**
In our documentation, we consider `BookQuote` a first class object, and we use other terms like "highlight" or "annotation" in very specific ways. 
- **Highlight** is an action and a UI instance of a `BookQuote`. When a user *highlghts* a piece of text, it becomes a `BookQuote` object. When the user sees the color underneath the text in the reader, that visualizaion (and code that creates it) is a highlight. In this sense, we can say that *highlight* is is a visualization of a `BookQuote` when it is in the context of the reader
- **Highlight Color** is a property of `BookQuote`. We understand that some readers have elaborate highlight/anotation practices when they read hard books, and we support this by enabling "highlight" to be a cross-book organization tag that hangs off of `BookQuote`
- **Annotation** is a note that a user hangs off of a `BookQuote` (or other things like a book location). 






THings we do not ned for 006: annotations, tags, even colors. I just want to make sure that we're structuring things in a way that these types of metadata can be added later (and are not properties of reader, the BookQuote object can stand on its own)





What 006 ships:
- User can highlight in the Reader
- Highlight is retained in the reader
- Basic Notebook page
- User can see the highlight listed in the Notebook page
(this helps us make sure that we can see highlight inside and outside reader)
- Data Page: a page where we can see the data that is being stored (in the app). It does not have to be pretty, just a way for us to see it so we know how it is being stored (we'll pretty it up in a later ticket).
  