import mongoose from 'mongoose';
import { softDeletePlugin } from '../plugins/softDelete.plugin.js';

const projectSchema = new mongoose.Schema(
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

        name: {
            type: String,
            required: true,
            trim: true
        },

        projectCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        address: {
            street: { type: String, trim: true },
            number: { type: String, trim: true },
            postal: { type: String, trim: true },
            city: { type: String, trim: true },
            province: { type: String, trim: true }
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        notes: {
            type: String,
            trim: true
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

projectSchema.index({ company: 1 });
projectSchema.index({ user: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ projectCode: 1, company: 1 });
projectSchema.index({ name: 1 });
projectSchema.index({ active: 1 });

projectSchema.plugin(softDeletePlugin);

const Project = mongoose.model('Project', projectSchema);

export default Project;