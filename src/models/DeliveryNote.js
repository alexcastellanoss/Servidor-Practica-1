import mongoose from 'mongoose';
import { softDeletePlugin } from '../plugins/softDelete.plugin.js';

const deliveryNoteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },

        format: {
            type: String,
            enum: ['material', 'hours'],
            required: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        workDate: {
            type: Date,
            required: true
        },

        material: {
            type: String,
            trim: true
        },

        quantity: {
            type: Number,
            min: 0
        },

        unit: {
            type: String,
            trim: true
        },

        hours: {
            type: Number,
            min: 0
        },

        workers: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            hours: {
                type: Number,
                required: true,
                min: 0
            }
        }],

        signed: {
            type: Boolean,
            default: false
        },

        signedAt: {
            type: Date,
            default: null
        },

        signatureUrl: {
            type: String,
            default: null
        },

        pdfUrl: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

deliveryNoteSchema.index({ company: 1 });
deliveryNoteSchema.index({ user: 1 });
deliveryNoteSchema.index({ client: 1 });
deliveryNoteSchema.index({ project: 1 });
deliveryNoteSchema.index({ format: 1 });
deliveryNoteSchema.index({ workDate: 1 });
deliveryNoteSchema.index({ signed: 1 });

deliveryNoteSchema.plugin(softDeletePlugin);

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);

export default DeliveryNote;