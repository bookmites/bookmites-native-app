

SO here is a thought: how are we doing BookID so that other books can be recognized. 
Over time, the team is very interested in "social" features. I can imagine a situation where a Abby shares a BookQuote with someone Becky, and Becky reads the quote and decides to get the book. 
This is where is gets tricky. We can imagine two scenarios:
1. (Easy..ier) They're both getting a book from Standard Epubs (which we're importing to the Bookmites library). We'll need to have some way to make sure that Abby's BookID will match Becky's BookID
2. (Harder) They get the book from different places. We can imagine that they're reading a classic that has been made into a epub many times in many places. How do we reverse-figure out what "book" that BookQuote came from?

This doesn't have to be 100% deterministic, but we do want it to feel coherent. We want to build a community of people who read hard classic philosophy books. 

---

"Schema-and-paths today says remove book entirely → delete progress (and future highlights) then delete books. Your PRD emphasizes quotes as long-lived user material that outlive reading sessions and show up on home and in AI."
I'm starting to think that we don't want this. Or, at least, this is different from deleting a book file. Whenever we put this into the app, we'll make it explicit that when someone deletes a BookID payload, they're deleting EVERYTHING. But things like book progress, we should save by default, make it hard to delete, and also make it possible for people to only modify specific attributes of this bookid object (reset position, delete a specifica BookQuote, etc...). It is making me start to think that we need a PRD for BookID, since this is a complex objec tthat is more than the sum of our conversations and tickets. 

---

This is all making me think that we might need a way to "match" books. Either books that are 100% the same (user deleted a book file, then re-imported the same file) and books that are 98% the same (an epub that someone has that someone else has edited) or books that are 95% the same (two epubs that are different translations of Thus Spake Zarthuatra). This is a bigger topic for another day, but we'll need to think about what kind of UX we want for this. It might be that Bookmites needs to maintain a little lookup table somewhere online, though that gets tricky (for a lot of reasons). 