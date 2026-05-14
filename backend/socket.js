// Singleton Socket.io — permet d'accéder à io partout sans circular import
let _io = null;

export const initIO = (io) => { _io = io; };
export const getIO  = ()   => {
  if (!_io) throw new Error("Socket.io non initialisé — appelez initIO() d'abord.");
  return _io;
};