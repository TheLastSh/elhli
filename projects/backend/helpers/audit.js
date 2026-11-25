import { Schema, model, ObjectId } from 'mongoose';

const Audit = model('AuditLog', new Schema({
  user: { type: ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String },
  details: { type: Object },
  at: { type: Date, default: Date.now }
}), { timestamps: true });

export const writeAudit = async (user, action, details = {}) => {
  try {
    if (user?.id) await Audit.create({ user: user.id, action, details });
  } catch (e) {
    // audit no debe bloquear el flujo principal
  }
};

export default Audit;
