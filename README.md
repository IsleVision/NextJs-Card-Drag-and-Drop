
## Card Drag and Drop

https://github.com/user-attachments/assets/4f525d47-bec3-4cdd-8826-079154a45193

### Start the project

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

It implements a drag and drop feature for cards by array manipulation and CSS styles without using 'dnd' libraries.

To launch the project, first run the following commands to install and build the project:

```bash
make install
```

Then type 'make' to start the server
```bash
make install
```
You now can view the page at [http://localhost:3000](http://localhost:3000)


### Idea
The idea behind the project is to maintain an array of refs to measure the position of each card and calculate the new position of the card when it is dragged. When the new position is calculated, the array is updated and the cards are reordered, and highlighting the new position of the dragged card.
This is a lightweight solution and easy to apply custom styles.
