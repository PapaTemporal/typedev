#![cfg_attr(not(feature = "sync"), allow(dead_code, unreachable_pub))]

//! A one-shot channel is used for sending a single message between
//! asynchronous tasks. The [`channel`] function is used to create a
//! [`Sender`] and [`Receiver`] handle pair that form the channel.
//!
//! The `Sender` handle is used by the producer to send the value.
//! The `Receiver` handle is used by the consumer to receive the value.
//!
//! Each handle can be used on separate tasks.
//!
//! Since the `send` method is not async, it can be used anywhere. This includes
//! sending between two runtimes, and using it from non-async code.
//!
//! If the [`Receiver`] is closed before receiving a message which has already
//! been sent, the message will remain in the channel until the receiver is
//! dropped, at which point the message will be dropped immediately.
//!
//! # Examples
//!
//! ```
//! use tokio::sync::oneshot;
//!
//! # #[tokio::main(flavor = "current_thread")]
//! # async fn main() {
//! let (tx, rx) = oneshot::channel();
//!
//! tokio::spawn(async move {
//!     if let Err(_) = tx.send(3) {
//!         println!("the receiver dropped");
//!     }
//! });
//!
//! match rx.await {
//!     Ok(v) => println!("got = {:?}", v),
//!     Err(_) => println!("the sender dropped"),
//! }
//! # }
//! ```
//!
//! If the sender is dropped without sending, the receiver will fail with
//! [`error::RecvError`]:
//!
//! ```
//! use tokio::sync::oneshot;
//!
//! # #[tokio::main(flavor = "current_thread")]
//! # async fn main() {
//! let (tx, rx) = oneshot::channel::<u32>();
//!
//! tokio::spawn(async move {
//!     drop(tx);
//! });
//!
//! match rx.await {
//!     Ok(_) => panic!("This doesn't happen"),
//!     Err(_) => println!("the sender dropped"),
//! }
//! # }
//! ```
//!
//! To use a `oneshot` channel in a `tokio::select!` loop, add `&mut` in front of
//! the channel.
//!
//! ```
//! use tokio::sync::oneshot;
//! use tokio::time::{interval, sleep, Duration};
//!
//! # #[tokio::main(flavor = "current_thread")]
//! # async fn _doc() {}
//! # #[tokio::main(flavor = "current_thread", start_paused = true)]
//! # async fn main() {
//! let (send, mut recv) = oneshot::channel();
//! let mut interval = interval(Duration::from_millis(100));
//!
//! # let handle =
//! tokio::spawn(async move {
//!     sleep(Duration::from_secs(1)).await;
//!     send.send("shut down").unwrap();
//! });
//!
//! loop {
//!     tokio::select! {
//!         _ = interval.tick() => println!("Another 100ms"),
//!         msg = &mut recv => {
//!             println!("Got message: {}", msg.unwrap());
//!             break;
//!         }
//!     }
//! }
//! # handle.await.unwrap();
//! # }
//! ```
//!
//! To use a `Sender` from a destructor, put it in an [`Option`] and call
//! [`Option::take`].
//!
//! ```
//! use tokio::sync::oneshot;
//!
//! struct SendOnDrop {
//!     sender: Option<oneshot::Sender<&'static str>>,
//! }
//! impl Drop for SendOnDrop {
//!     fn drop(&mut self) {
//!         if let Some(sender) = self.sender.take() {
//!             // Using `let _ =` to ignore send errors.
//!             let _ = sender.send("I got dropped!");
//!         }
//!     }
